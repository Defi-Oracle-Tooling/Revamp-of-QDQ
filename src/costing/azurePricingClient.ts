/**
 * Azure Pricing API Client
 *
 * This module provides interfaces to the Azure Pricing REST API
 * to fetch live pricing data for Azure services used in Quorum deployments.
 *
 * API Documentation: https://docs.microsoft.com/en-us/rest/api/cost-management/retail-prices/azure-retail-prices
 */

import https from 'https';
import { URL } from 'url';

/**
 * Azure Pricing API response structure
 */
export interface AzurePricingResponse {
    BillingCurrency: string;
    CustomerEntityId: string;
    CustomerEntityType: string;
    Items: PricingItem[];
    NextPageLink?: string;
    Count: number;
}

/**
 * Individual pricing item from Azure API
 */
export interface PricingItem {
    currencyCode: string;
    tierMinimumUnits: number;
    retailPrice: number;
    unitPrice: number;
    armRegionName: string;
    location: string;
    effectiveStartDate: string;
    meterId: string;
    meterName: string;
    productId: string;
    skuId: string;
    productName: string;
    skuName: string;
    serviceName: string;
    serviceId: string;
    serviceFamily: string;
    unitOfMeasure: string;
    type: string;
    isPrimaryMeterRegion: boolean;
    armSkuName: string;
}

/**
 * Simplified pricing information for internal use
 */
export interface SimplifiedPricing {
    service: string;
    sku: string;
    region: string;
    pricePerHour: number;
    currency: string;
    unitOfMeasure: string;
    meterName: string;
}

/**
 * Configuration options for Azure Pricing API client
 */
export interface AzurePricingClientOptions {
    /** Azure region for pricing (affects currency and regional rates) */
    region?: string;
    /** Preferred currency code (USD, EUR, etc.) */
    currency?: string;
    /** API request timeout in milliseconds */
    timeout?: number;
    /** Enable caching of pricing data */
    enableCache?: boolean;
    /** Cache TTL in minutes */
    cacheTtl?: number;
}

/**
 * Default configuration for Azure Pricing API client
 */
const DEFAULT_OPTIONS: Required<AzurePricingClientOptions> = {
    region: 'eastus',
    currency: 'USD',
    timeout: 30000,
    enableCache: true,
    cacheTtl: 60
};

/**
 * Cache entry for pricing data
 */
interface CacheEntry {
    data: SimplifiedPricing[];
    timestamp: number;
    ttl: number;
}

/**
 * Azure Pricing API client for fetching live pricing data
 *
 * Provides methods to query Azure retail pricing for various services
 * including compute, storage, networking, and monitoring resources.
 */
export class AzurePricingClient {
    private options: Required<AzurePricingClientOptions>;
    private cache: Map<string, CacheEntry> = new Map();
    private readonly baseUrl = 'https://prices.azure.com/api/retail/prices';

    constructor(options: AzurePricingClientOptions = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    /**
     * Get pricing for Virtual Machines
     */
    async getVmPricing(region?: string, vmSizes?: string[]): Promise<SimplifiedPricing[]> {
        const targetRegion = region || this.options.region;
        const cacheKey = `vm-${targetRegion}-${vmSizes?.join(',') || 'all'}`;

        if (this.options.enableCache && this.isCacheValid(cacheKey)) {
            return this.cache.get(cacheKey)!.data;
        }

        const filters = [
            `serviceName eq 'Virtual Machines'`,
            `armRegionName eq '${targetRegion}'`,
            `currencyCode eq '${this.options.currency}'`,
            `type eq 'Consumption'`
        ];

        if (vmSizes && vmSizes.length > 0) {
            const sizeFilter = vmSizes.map(size => `armSkuName eq '${size}'`).join(' or ');
            filters.push(`(${sizeFilter})`);
        }

        const pricing = await this.queryPricing(filters);
        const simplified = pricing.map(item => this.simplifyPricingItem(item));

        if (this.options.enableCache) {
            this.setCacheEntry(cacheKey, simplified);
        }

        return simplified;
    }

    /**
     * Get pricing for Azure Kubernetes Service (AKS)
     */
    async getAksPricing(region?: string): Promise<SimplifiedPricing[]> {
        const targetRegion = region || this.options.region;
        const cacheKey = `aks-${targetRegion}`;

        if (this.options.enableCache && this.isCacheValid(cacheKey)) {
            return this.cache.get(cacheKey)!.data;
        }

        const filters = [
            `serviceName eq 'Azure Kubernetes Service'`,
            `armRegionName eq '${targetRegion}'`,
            `currencyCode eq '${this.options.currency}'`,
            `type eq 'Consumption'`
        ];

        const pricing = await this.queryPricing(filters);
        const simplified = pricing.map(item => this.simplifyPricingItem(item));

        if (this.options.enableCache) {
            this.setCacheEntry(cacheKey, simplified);
        }

        return simplified;
    }

    /**
     * Get pricing for Container Apps
     */
    async getContainerAppsPricing(region?: string): Promise<SimplifiedPricing[]> {
        const targetRegion = region || this.options.region;
        const cacheKey = `aca-${targetRegion}`;

        if (this.options.enableCache && this.isCacheValid(cacheKey)) {
            return this.cache.get(cacheKey)!.data;
        }

        const filters = [
            `serviceName eq 'Container Apps'`,
            `armRegionName eq '${targetRegion}'`,
            `currencyCode eq '${this.options.currency}'`,
            `type eq 'Consumption'`
        ];

        const pricing = await this.queryPricing(filters);
        const simplified = pricing.map(item => this.simplifyPricingItem(item));

        if (this.options.enableCache) {
            this.setCacheEntry(cacheKey, simplified);
        }

        return simplified;
    }

    /**
     * Get pricing for Log Analytics
     */
    async getLogAnalyticsPricing(region?: string): Promise<SimplifiedPricing[]> {
        const targetRegion = region || this.options.region;
        const cacheKey = `logs-${targetRegion}`;

        if (this.options.enableCache && this.isCacheValid(cacheKey)) {
            return this.cache.get(cacheKey)!.data;
        }

        const filters = [
            `serviceName eq 'Log Analytics'`,
            `armRegionName eq '${targetRegion}'`,
            `currencyCode eq '${this.options.currency}'`,
            `type eq 'Consumption'`
        ];

        const pricing = await this.queryPricing(filters);
        const simplified = pricing.map(item => this.simplifyPricingItem(item));

        if (this.options.enableCache) {
            this.setCacheEntry(cacheKey, simplified);
        }

        return simplified;
    }

    /**
     * Get pricing for Application Insights
     */
    async getAppInsightsPricing(region?: string): Promise<SimplifiedPricing[]> {
        const targetRegion = region || this.options.region;
        const cacheKey = `insights-${targetRegion}`;

        if (this.options.enableCache && this.isCacheValid(cacheKey)) {
            return this.cache.get(cacheKey)!.data;
        }

        const filters = [
            `serviceName eq 'Application Insights'`,
            `armRegionName eq '${targetRegion}'`,
            `currencyCode eq '${this.options.currency}'`,
            `type eq 'Consumption'`
        ];

        const pricing = await this.queryPricing(filters);
        const simplified = pricing.map(item => this.simplifyPricingItem(item));

        if (this.options.enableCache) {
            this.setCacheEntry(cacheKey, simplified);
        }

        return simplified;
    }

    /**
     * Get pricing for Storage Accounts
     */
    async getStoragePricing(region?: string, storageType?: 'Standard_LRS' | 'Premium_LRS'): Promise<SimplifiedPricing[]> {
        const targetRegion = region || this.options.region;
        const cacheKey = `storage-${targetRegion}-${storageType || 'all'}`;

        if (this.options.enableCache && this.isCacheValid(cacheKey)) {
            return this.cache.get(cacheKey)!.data;
        }

        const filters = [
            `serviceName eq 'Storage'`,
            `armRegionName eq '${targetRegion}'`,
            `currencyCode eq '${this.options.currency}'`,
            `type eq 'Consumption'`
        ];

        if (storageType) {
            filters.push(`skuName eq '${storageType}'`);
        }

        const pricing = await this.queryPricing(filters);
        const simplified = pricing.map(item => this.simplifyPricingItem(item));

        if (this.options.enableCache) {
            this.setCacheEntry(cacheKey, simplified);
        }

        return simplified;
    }

    /**
     * Get pricing for Load Balancer
     */
    async getLoadBalancerPricing(region?: string): Promise<SimplifiedPricing[]> {
        const targetRegion = region || this.options.region;
        const cacheKey = `lb-${targetRegion}`;

        if (this.options.enableCache && this.isCacheValid(cacheKey)) {
            return this.cache.get(cacheKey)!.data;
        }

        const filters = [
            `serviceName eq 'Load Balancer'`,
            `armRegionName eq '${targetRegion}'`,
            `currencyCode eq '${this.options.currency}'`,
            `type eq 'Consumption'`
        ];

        const pricing = await this.queryPricing(filters);
        const simplified = pricing.map(item => this.simplifyPricingItem(item));

        if (this.options.enableCache) {
            this.setCacheEntry(cacheKey, simplified);
        }

        return simplified;
    }

    /**
     * Query Azure Pricing API with filters
     */
    private async queryPricing(filters: string[], pageSize = 1000): Promise<PricingItem[]> {
        const filterString = filters.join(' and ');
        const url = new URL(this.baseUrl);
        url.searchParams.set('$filter', filterString);
        url.searchParams.set('$top', pageSize.toString());

        const items: PricingItem[] = [];
        let nextPageUrl: string | undefined = url.toString();

        while (nextPageUrl) {
            const response = await this.makeHttpRequest(nextPageUrl);
            items.push(...response.Items);
            nextPageUrl = response.NextPageLink;

            // Limit to prevent excessive API calls
            if (items.length > 10000) {
                console.warn('Azure Pricing API: Too many results, truncating at 10,000 items');
                break;
            }
        }

        return items;
    }

    /**
     * Make HTTP request to Azure Pricing API
     */
    private async makeHttpRequest(url: string): Promise<AzurePricingResponse> {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || 443,
                path: parsedUrl.pathname + parsedUrl.search,
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'quorum-dev-quickstart-costing/1.0'
                },
                timeout: this.options.timeout
            };

            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', chunk => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        if (res.statusCode !== 200) {
                            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                            return;
                        }

                        const response = JSON.parse(data) as AzurePricingResponse;
                        resolve(response);
                    } catch (error) {
                        reject(new Error(`Failed to parse response: ${error}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Request failed: ${error.message}`));
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error(`Request timeout after ${this.options.timeout}ms`));
            });

            req.end();
        });
    }

    /**
     * Convert Azure pricing item to simplified format
     */
    private simplifyPricingItem(item: PricingItem): SimplifiedPricing {
        // Convert pricing to per-hour if necessary
        let pricePerHour = item.retailPrice;

        // Handle different billing units
        switch (item.unitOfMeasure.toLowerCase()) {
            case '1 hour':
            case '1/hour':
            case 'hours':
                pricePerHour = item.retailPrice;
                break;
            case '1 month':
            case 'monthly':
                pricePerHour = item.retailPrice / (30 * 24); // Approximate
                break;
            case '1 day':
            case 'daily':
                pricePerHour = item.retailPrice / 24;
                break;
            case '1 minute':
            case 'minutes':
                pricePerHour = item.retailPrice * 60;
                break;
            case '1 second':
            case 'seconds':
                pricePerHour = item.retailPrice * 3600;
                break;
            default:
                // For storage, data transfer, etc. - use as-is
                pricePerHour = item.retailPrice;
        }

        return {
            service: item.serviceName,
            sku: item.armSkuName || item.skuName,
            region: item.armRegionName,
            pricePerHour,
            currency: item.currencyCode,
            unitOfMeasure: item.unitOfMeasure,
            meterName: item.meterName
        };
    }

    /**
     * Check if cache entry is valid
     */
    private isCacheValid(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;

        const now = Date.now();
        return (now - entry.timestamp) < (entry.ttl * 60 * 1000);
    }

    /**
     * Set cache entry
     */
    private setCacheEntry(key: string, data: SimplifiedPricing[]): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: this.options.cacheTtl
        });
    }

    /**
     * Clear all cached pricing data
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { entries: number; totalSizeKB: number } {
        let totalSize = 0;
        for (const [key, entry] of this.cache) {
            totalSize += JSON.stringify({ key, entry }).length;
        }
        return {
            entries: this.cache.size,
            totalSizeKB: Math.round(totalSize / 1024)
        };
    }
}

/**
 * Utility function to get pricing for a specific resource type and SKU
 */
export async function getPricingForResource(
    resourceType: string,
    sku: string,
    region: string,
    options: AzurePricingClientOptions = {}
): Promise<SimplifiedPricing | null> {
    const client = new AzurePricingClient(options);

    try {
        let pricing: SimplifiedPricing[] = [];

        switch (resourceType.toLowerCase()) {
            case 'vm':
            case 'virtual-machine':
                pricing = await client.getVmPricing(region, [sku]);
                break;
            case 'aks':
            case 'kubernetes':
                pricing = await client.getAksPricing(region);
                break;
            case 'aca':
            case 'container-apps':
                pricing = await client.getContainerAppsPricing(region);
                break;
            case 'logs':
            case 'log-analytics':
                pricing = await client.getLogAnalyticsPricing(region);
                break;
            case 'insights':
            case 'application-insights':
                pricing = await client.getAppInsightsPricing(region);
                break;
            case 'storage':
                pricing = await client.getStoragePricing(region, sku as any);
                break;
            case 'load-balancer':
                pricing = await client.getLoadBalancerPricing(region);
                break;
            default:
                console.warn(`Unknown resource type for pricing: ${resourceType}`);
                return null;
        }

        // Find exact match or closest match
        const exactMatch = pricing.find(p => p.sku === sku);
        if (exactMatch) return exactMatch;

        // Return first result if no exact match
        return pricing.length > 0 ? pricing[0] : null;

    } catch (error) {
        console.warn(`Failed to get pricing for ${resourceType}/${sku}: ${error}`);
        return null;
    }
}