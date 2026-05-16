// Replaced by src/data/mockData.js — backward-compat re-export stub.
import {
  CURRENT_CLIENT_ID,
  CURRENT_PROVIDER_ID,
  MOCK_CURRENT_CLIENT as _client,
  MOCK_CURRENT_PROVIDER as _provider,
} from './mockData';

export { CURRENT_CLIENT_ID, CURRENT_PROVIDER_ID };

// Add .name alias so existing pages that read MOCK_CURRENT_PROVIDER.name keep working.
export const MOCK_CURRENT_CLIENT   = { ..._client,   name: _client.fullName };
export const MOCK_CURRENT_PROVIDER = { ..._provider, name: _provider.fullName };
