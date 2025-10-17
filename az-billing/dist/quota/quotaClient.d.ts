import { DefaultAzureCredential } from '@azure/identity';
export interface QuotaUsage {
    namespace: string;
    limit: number;
    current: number;
    unit: string;
    region: string;
}
export interface QuotaEvaluation {
    shortages: {
        namespace: string;
        required: number;
        deficit: number;
        region: string;
    }[];
    summary: string;
    tokenAcquired?: boolean;
    subscription?: string;
}
export interface AzureQuotaFetchOptions {
    subscriptionId: string;
    region: string;
    timeoutMs?: number;
    credential?: DefaultAzureCredential;
}
export declare function fetchRegionQuota(options: AzureQuotaFetchOptions): Promise<QuotaUsage[]>;
export declare function evaluateQuota(plan: {
    regions: string[];
    placements: Record<string, any>;
}, quota: QuotaUsage[]): QuotaEvaluation;
//# sourceMappingURL=quotaClient.d.ts.map