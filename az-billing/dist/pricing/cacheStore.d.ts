export interface PersistentCacheOptions {
    cacheFile?: string;
    ttlMs?: number;
    disabled?: boolean;
}
export interface PricingCacheRecord {
    pricePerHour: number;
    ts: number;
}
export type PricingCacheData = Record<string, PricingCacheRecord>;
export declare class PricingCacheStore {
    private data;
    private opts;
    private dirty;
    constructor(opts?: PersistentCacheOptions);
    private load;
    get(key: string): PricingCacheRecord | undefined;
    set(key: string, pricePerHour: number): void;
    save(): void;
    clear(): void;
}
export declare function getPersistentPricingCache(opts?: PersistentCacheOptions): PricingCacheStore;
//# sourceMappingURL=cacheStore.d.ts.map