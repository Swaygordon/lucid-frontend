import { ALL_CATEGORIES } from '../../data/catalog/categories.js';
import { LAUNCH_CATEGORIES, resolveLaunchSearch } from '../../data/catalog/launchServices.js';

// Search routes only to active launch services. Removed offerings intentionally have no alias.
export const SEARCH_SYNONYMS = Object.fromEntries(LAUNCH_CATEGORIES.flatMap(category =>
  category.services.flatMap(service => service.keywords.map(keyword => [keyword, `${category.slug}/${service.slug}`]))
));

export const resolveSearch = rawQuery => {
  const match = resolveLaunchSearch(rawQuery);
  if (!match) return null;
  return match.serviceSlug
    ? `/lucid/services/${match.categorySlug}/${match.serviceSlug}`
    : `/lucid/services/${match.categorySlug}`;
};

export const buildSuggestions = (rawQuery, { maxCategories = 4, maxServices = 5 } = {}) => {
  const query = (rawQuery || '').trim().toLowerCase();
  if (!query) return { categories: [], services: [] };
  const categories = [];
  const services = [];
  for (const category of ALL_CATEGORIES) {
    if ([category.name, category.description, category.slug].some(value => value.toLowerCase().includes(query))) {
      categories.push({
        type: 'category', id: `cat-${category.id}`, name: category.name,
        description: category.description, icon: category.icon, iconColor: category.iconColor,
        color: category.color, to: `/lucid/services/${category.slug}`,
      });
    }
    for (const service of category.services) {
      if ([service.name, service.slug, ...(service.keywords || [])].some(value => value.toLowerCase().includes(query))) {
        services.push({
          type: 'service', id: `svc-${category.slug}/${service.slug}`, name: service.name,
          icon: category.icon, iconColor: category.iconColor, color: category.color,
          categoryName: category.name, to: `/lucid/services/${category.slug}/${service.slug}`,
        });
      }
    }
  }
  return { categories: categories.slice(0, maxCategories), services: services.slice(0, maxServices) };
};
