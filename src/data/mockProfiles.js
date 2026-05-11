// Replaced by src/data/mockData.js — backward-compat re-export stub.
import { MOCK_PROVIDERS, MOCK_CLIENTS } from './mockData';

export { MOCK_PROVIDERS as mockProviders, MOCK_CLIENTS as mockClients };

// Helpers used by selected_service.jsx
export const getProvidersBySkill = (skill) =>
  MOCK_PROVIDERS.filter(p =>
    p.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
  );

export const getProvidersByArea = (area) =>
  MOCK_PROVIDERS.filter(p =>
    p.location.area.toLowerCase() === area.toLowerCase()
  );

export const getTopRatedProviders = (limit = 10) =>
  [...MOCK_PROVIDERS]
    .sort((a, b) => b.rating.overall - a.rating.overall)
    .slice(0, limit);

export const getAvailableProviders = () =>
  MOCK_PROVIDERS.filter(p => p.availability.status === 'available');
