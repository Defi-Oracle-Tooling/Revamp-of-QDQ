import fs from 'fs';
import path from 'path';

export interface PersistentCacheOptions { cacheFile?: string; ttlMs?: number; disabled?: boolean; }
export interface PricingCacheRecord { pricePerHour: number; ts: number; }
export type PricingCacheData = Record<string, PricingCacheRecord>;

const DEFAULT_TTL = 1000 * 60 * 60; // 1 hour
const DEFAULT_FILE = path.resolve(__dirname, '..', '..', '.pricing-cache.json');

export class PricingCacheStore {
  private data: PricingCacheData = {};
  private opts: PersistentCacheOptions;
  private dirty = false;

  constructor(opts: PersistentCacheOptions = {}) {
    this.opts = { cacheFile: DEFAULT_FILE, ttlMs: DEFAULT_TTL, ...opts };
    if (!this.opts.disabled) this.load();
  }

  private load(): void {
    const file = this.opts.cacheFile!;
    try {
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, 'utf-8');
        this.data = JSON.parse(raw) as PricingCacheData;
      }
    } catch (e) {
      // Corrupt file fallback
      this.data = {};
    }
  }

  get(key: string): PricingCacheRecord | undefined {
    if (this.opts.disabled) return undefined;
    const rec = this.data[key];
    if (!rec) return undefined;
    const ttl = this.opts.ttlMs || DEFAULT_TTL;
    if ((Date.now() - rec.ts) > ttl) {
      delete this.data[key];
      this.dirty = true;
      return undefined;
    }
    return rec;
  }

  set(key: string, pricePerHour: number): void {
    if (this.opts.disabled) return;
    this.data[key] = { pricePerHour, ts: Date.now() };
    this.dirty = true;
  }

  save(): void {
    if (this.opts.disabled || !this.dirty) return;
    const file = this.opts.cacheFile!;
    try {
      fs.writeFileSync(file, JSON.stringify(this.data, null, 2));
      this.dirty = false;
    } catch {
      // Ignore write errors (e.g., RO filesystem)
    }
  }

  clear(): void {
    this.data = {};
    this.dirty = true;
  }
}

// Singleton accessor (lazy) so multiple imports share persistent state
let singleton: PricingCacheStore | null = null;
export function getPersistentPricingCache(opts: PersistentCacheOptions = {}): PricingCacheStore {
  if (!singleton) singleton = new PricingCacheStore(opts);
  return singleton;
}
