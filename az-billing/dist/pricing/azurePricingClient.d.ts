export interface PricingQueryOptions {
    region: string;
    currency: string;
    timeout?: number;
    persistentCache?: boolean;
    cacheFile?: string;
    ttlMs?: number;
}
export interface PricingResult {
    pricePerHour: number;
    sku: string;
    resourceType: string;
    currency: string;
    source: 'estimated' | 'live' | 'cached';
}
export declare function getPricingForResource(resourceType: string, sku: string, region: string, opts: PricingQueryOptions): Promise<PricingResult | null>;
export declare function clearPricingCache(opts?: {
    clearPersistent?: boolean;
}): void;
//# sourceMappingURL=azurePricingClient.d.ts.map