import { loadWellsFargoConfig } from '../integrations/wellsfargo/config';
import { loadTatumConfigFromEnv } from '../secrets/azureKeyVault';

export interface AppConfig {
  wellsFargo: import('../integrations/wellsfargo/config').WellsFargoConfig;
  tatum: import('../integrations/tatum/tatum').TatumConfig;
  loadedAt: number;
}

let _cached: AppConfig | undefined;

export async function loadAppConfig(forceRefresh = false): Promise<AppConfig> {
  if (_cached && !forceRefresh) return _cached;
  const wellsFargo = await loadWellsFargoConfig();
  const tatum = await loadTatumConfigFromEnv();
  _cached = { wellsFargo, tatum, loadedAt: Date.now() };
  return _cached;
}

export function getCachedConfig(): AppConfig | undefined { return _cached; }

export function clearConfigCache(): void { _cached = undefined; }