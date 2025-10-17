// Persistence layer for Wells Fargo integration
export interface RawPayload {
  id: string;
  type: 'balance' | 'transaction' | 'payment' | 'fx' | 'lockbox';
  receivedAt: string;
  payload: string; // raw JSON/XML
  checksum: string;
}

export interface NormalizedDTO {
  id: string;
  type: RawPayload['type'];
  data: any;
  normalizedAt: string;
}

const _rawStore: RawPayload[] = [];
const _normalizedStore: NormalizedDTO[] = [];

export async function saveRawPayload(payload: RawPayload): Promise<void> {
  _rawStore.push(payload);
}

export async function getRawPayloads(type?: RawPayload['type']): Promise<RawPayload[]> {
  if (!type) return _rawStore;
  return _rawStore.filter(p => p.type === type);
}

export async function saveNormalizedDTO(dto: NormalizedDTO): Promise<void> {
  _normalizedStore.push(dto);
}

export async function getNormalizedDTOs(type?: RawPayload['type']): Promise<NormalizedDTO[]> {
  if (!type) return _normalizedStore;
  return _normalizedStore.filter(d => d.type === type);
}
