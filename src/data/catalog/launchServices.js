// Canonical launch catalog. These stable slugs are the frontend contract for routes,
// request snapshots, provider/inspector service choices, and Admin assignment matching.
export const CONSTRUCTION_WORK_TYPES = [
  { id: 'block-brick-work', label: 'Block and brick work' },
  { id: 'masonry-plastering', label: 'Masonry and plastering' },
  { id: 'roofing', label: 'Roofing' },
  { id: 'tiling-flooring', label: 'Tiling and flooring' },
  { id: 'structural-repair', label: 'Structural repair' },
  { id: 'other-construction', label: 'Other construction work' },
];

export const LAUNCH_CATEGORIES = [
  {
    id: 'home-repairs', name: 'Home Repairs & Maintenance', slug: 'home-repairs',
    description: 'Plumbing, electrical, carpentry, and general home repairs.', iconKey: 'hammer',
    imageKey: 'homeRepairs', color: 'bg-blue-100', iconColor: 'text-blue-700',
    services: [
      { id: 'plumbing', slug: 'plumbing', name: 'Plumber', iconKey: 'droplets', imageKey: 'plumber', keywords: ['plumbing', 'pipe repair', 'pipe fitting', 'drain repair', 'sink installation'] },
      { id: 'electrical', slug: 'electrical', name: 'Electrician', iconKey: 'zap', imageKey: 'electrician', keywords: ['electrical', 'wiring', 'rewiring', 'socket repair', 'light installation'] },
      { id: 'carpentry', slug: 'carpentry', name: 'Carpenter', iconKey: 'hammer', imageKey: 'carpenter', keywords: ['carpentry', 'woodworker', 'joiner', 'cabinet maker', 'furniture maker'] },
      { id: 'handyman', slug: 'handyman', name: 'Handyman', iconKey: 'wrench', imageKey: 'handyman', keywords: ['home repair', 'general repairs', 'odd jobs'] },
    ],
  },
  {
    id: 'auto-repairs', name: 'Auto Repairs', slug: 'auto-repairs',
    description: 'Vehicle inspection, diagnostics, and mechanical repairs.', iconKey: 'car',
    imageKey: 'autoRepairs', color: 'bg-red-100', iconColor: 'text-red-700',
    services: [
      { id: 'auto-mechanic', slug: 'auto-mechanic', name: 'Auto mechanic', iconKey: 'car-front', imageKey: 'autoMechanic', keywords: ['mechanic', 'car mechanic', 'automobile mechanic', 'garage', 'car repair', 'vehicle repair', 'engine repair', 'auto repair', 'car service', 'oil change', 'brake service'] },
    ],
  },
  {
    id: 'cleaning', name: 'Cleaning Services', slug: 'cleaning',
    description: 'Home and small-business cleaning services.', iconKey: 'sparkles',
    imageKey: 'cleaning', color: 'bg-green-100', iconColor: 'text-green-700',
    services: [
      { id: 'cleaner', slug: 'cleaner', name: 'Cleaner', iconKey: 'sparkles', imageKey: 'cleaner', keywords: ['cleaning', 'house cleaning', 'home cleaning', 'office cleaning', 'domestic cleaner'] },
    ],
  },
  {
    id: 'construction', name: 'Construction & Renovation', slug: 'construction',
    description: 'Construction work matched to the scope described in your request.', iconKey: 'hardhat',
    imageKey: 'construction', color: 'bg-yellow-100', iconColor: 'text-yellow-700',
    services: [
      { id: 'construction-worker', slug: 'construction-worker', name: 'Construction worker', iconKey: 'hardhat', imageKey: 'constructionWorker', keywords: ['builder', 'contractor', 'construction', 'building contractor', 'mason', 'bricklayer', 'block layer', 'plasterer', 'roofing', 'roofer', 'tiler'], workTypes: CONSTRUCTION_WORK_TYPES },
    ],
  },
];

export const LAUNCH_SERVICES = LAUNCH_CATEGORIES.flatMap(category =>
  category.services.map(service => ({ ...service, categoryId: category.id, categorySlug: category.slug, categoryName: category.name }))
);

export const getLaunchService = (categorySlug, serviceSlug) =>
  LAUNCH_CATEGORIES.find(category => category.slug === categorySlug)?.services.find(service => service.slug === serviceSlug) ?? null;

export const resolveLaunchSearch = rawQuery => {
  const query = (rawQuery || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!query) return null;
  for (const category of LAUNCH_CATEGORIES) {
    if (category.name.toLowerCase() === query || category.slug === query) return { categorySlug: category.slug };
    for (const service of category.services) {
      if (service.name.toLowerCase() === query || service.slug === query || service.keywords.includes(query)) {
        return { categorySlug: category.slug, serviceSlug: service.slug };
      }
    }
  }
  if (query.length >= 3) {
    for (const category of LAUNCH_CATEGORIES) {
      for (const service of category.services) {
        if (service.name.toLowerCase().includes(query)) return { categorySlug: category.slug, serviceSlug: service.slug };
      }
    }
  }
  return null;
};

export const buildLaunchSuggestions = rawQuery => {
  const query = (rawQuery || '').trim().toLowerCase();
  if (!query) return { categories: [], services: [] };
  const categories = [];
  const services = [];
  for (const category of LAUNCH_CATEGORIES) {
    if ([category.name, category.description, category.slug].some(value => value.toLowerCase().includes(query))) categories.push(category);
    for (const service of category.services) {
      if ([service.name, service.slug, ...service.keywords].some(value => value.toLowerCase().includes(query))) services.push({ ...service, categorySlug: category.slug, categoryName: category.name });
    }
  }
  return { categories, services };
};
export const validateLaunchServiceRequest = ({ serviceId, constructionWorkTypeId = '', preferVerifiedCredential = false }) => {
  const service = LAUNCH_SERVICES.find(item => item.id === serviceId);
  if (!service) return { valid: false, error: 'Choose an active LUCID launch service.' };
  if (service.id === 'construction-worker' && !service.workTypes.some(type => type.id === constructionWorkTypeId)) {
    return { valid: false, error: 'Choose a valid construction work type.' };
  }
  return { valid: true, constructionWorkTypeId: service.id === 'construction-worker' ? constructionWorkTypeId : null, preferVerifiedCredential: Boolean(preferVerifiedCredential) };
};

export const getHistoricalServiceLabel = record => record?.serviceNameSnapshot || record?.service_name_snapshot || record?.serviceName || record?.service || 'Unknown service';
