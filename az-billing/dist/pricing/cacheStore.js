"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingCacheStore = void 0;
exports.getPersistentPricingCache = getPersistentPricingCache;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DEFAULT_TTL = 1000 * 60 * 60; // 1 hour
const DEFAULT_FILE = path_1.default.resolve(__dirname, '..', '..', '.pricing-cache.json');
class PricingCacheStore {
    constructor(opts = {}) {
        this.data = {};
        this.dirty = false;
        this.opts = { cacheFile: DEFAULT_FILE, ttlMs: DEFAULT_TTL, ...opts };
        if (!this.opts.disabled)
            this.load();
    }
    load() {
        const file = this.opts.cacheFile;
        try {
            if (fs_1.default.existsSync(file)) {
                const raw = fs_1.default.readFileSync(file, 'utf-8');
                this.data = JSON.parse(raw);
            }
        }
        catch (e) {
            // Corrupt file fallback
            this.data = {};
        }
    }
    get(key) {
        if (this.opts.disabled)
            return undefined;
        const rec = this.data[key];
        if (!rec)
            return undefined;
        const ttl = this.opts.ttlMs || DEFAULT_TTL;
        if ((Date.now() - rec.ts) > ttl) {
            delete this.data[key];
            this.dirty = true;
            return undefined;
        }
        return rec;
    }
    set(key, pricePerHour) {
        if (this.opts.disabled)
            return;
        this.data[key] = { pricePerHour, ts: Date.now() };
        this.dirty = true;
    }
    save() {
        if (this.opts.disabled || !this.dirty)
            return;
        const file = this.opts.cacheFile;
        try {
            fs_1.default.writeFileSync(file, JSON.stringify(this.data, null, 2));
            this.dirty = false;
        }
        catch {
            // Ignore write errors (e.g., RO filesystem)
        }
    }
    clear() {
        this.data = {};
        this.dirty = true;
    }
}
exports.PricingCacheStore = PricingCacheStore;
// Singleton accessor (lazy) so multiple imports share persistent state
let singleton = null;
function getPersistentPricingCache(opts = {}) {
    if (!singleton)
        singleton = new PricingCacheStore(opts);
    return singleton;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGVTdG9yZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wcmljaW5nL2NhY2hlU3RvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBdUVBLDhEQUdDO0FBMUVELDRDQUFvQjtBQUNwQixnREFBd0I7QUFNeEIsTUFBTSxXQUFXLEdBQUcsSUFBSSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxTQUFTO0FBQzdDLE1BQU0sWUFBWSxHQUFHLGNBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUscUJBQXFCLENBQUMsQ0FBQztBQUVoRixNQUFhLGlCQUFpQjtJQUs1QixZQUFZLE9BQStCLEVBQUU7UUFKckMsU0FBSSxHQUFxQixFQUFFLENBQUM7UUFFNUIsVUFBSyxHQUFHLEtBQUssQ0FBQztRQUdwQixJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsU0FBUyxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLEdBQUcsSUFBSSxFQUFFLENBQUM7UUFDckUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUTtZQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUN2QyxDQUFDO0lBRU8sSUFBSTtRQUNWLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBVSxDQUFDO1FBQ2xDLElBQUksQ0FBQztZQUNILElBQUksWUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUN4QixNQUFNLEdBQUcsR0FBRyxZQUFFLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDM0MsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBcUIsQ0FBQztZQUNsRCxDQUFDO1FBQ0gsQ0FBQztRQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDWCx3QkFBd0I7WUFDeEIsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7UUFDakIsQ0FBQztJQUNILENBQUM7SUFFRCxHQUFHLENBQUMsR0FBVztRQUNiLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRO1lBQUUsT0FBTyxTQUFTLENBQUM7UUFDekMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMzQixJQUFJLENBQUMsR0FBRztZQUFFLE9BQU8sU0FBUyxDQUFDO1FBQzNCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLFdBQVcsQ0FBQztRQUMzQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQztZQUNoQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDdEIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7WUFDbEIsT0FBTyxTQUFTLENBQUM7UUFDbkIsQ0FBQztRQUNELE9BQU8sR0FBRyxDQUFDO0lBQ2IsQ0FBQztJQUVELEdBQUcsQ0FBQyxHQUFXLEVBQUUsWUFBb0I7UUFDbkMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVE7WUFBRSxPQUFPO1FBQy9CLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxZQUFZLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDO1FBQ2xELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0lBQ3BCLENBQUM7SUFFRCxJQUFJO1FBQ0YsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLO1lBQUUsT0FBTztRQUM5QyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVUsQ0FBQztRQUNsQyxJQUFJLENBQUM7WUFDSCxZQUFFLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0QsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDckIsQ0FBQztRQUFDLE1BQU0sQ0FBQztZQUNQLDRDQUE0QztRQUM5QyxDQUFDO0lBQ0gsQ0FBQztJQUVELEtBQUs7UUFDSCxJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNmLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0lBQ3BCLENBQUM7Q0FDRjtBQXpERCw4Q0F5REM7QUFFRCx1RUFBdUU7QUFDdkUsSUFBSSxTQUFTLEdBQTZCLElBQUksQ0FBQztBQUMvQyxTQUFnQix5QkFBeUIsQ0FBQyxPQUErQixFQUFFO0lBQ3pFLElBQUksQ0FBQyxTQUFTO1FBQUUsU0FBUyxHQUFHLElBQUksaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDeEQsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQyJ9