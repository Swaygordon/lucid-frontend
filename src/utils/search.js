import { ALL_CATEGORIES } from '../data/categories.js';

// Profession nouns and common synonyms → service route (category/service or just category).
// Catches the gap between verb forms ("carpentry" ✓) and person nouns ("carpenter" ✗).
export const SEARCH_SYNONYMS = {
  // Auto Repairs
  'mechanic': 'auto-repairs/engine-repair',
  'car mechanic': 'auto-repairs/engine-repair',
  'auto mechanic': 'auto-repairs/engine-repair',
  'automobile mechanic': 'auto-repairs/engine-repair',
  'garage': 'auto-repairs/engine-repair',
  'garage service': 'auto-repairs/engine-repair',
  'car repair': 'auto-repairs/engine-repair',
  'vehicle repair': 'auto-repairs/engine-repair',
  'engine repair': 'auto-repairs/engine-repair',
  'auto repair': 'auto-repairs/engine-repair',
  'car service': 'auto-repairs/engine-repair',
  'auto service': 'auto-repairs/engine-repair',
  'oil change': 'auto-repairs/engine-repair',
  'tire repair': 'auto-repairs/tire-services',
  'tyre repair': 'auto-repairs/tire-services',
  'vulcanizer': 'auto-repairs/tire-services',
  'wheel balancing': 'auto-repairs/tire-services',
  'spray painter': 'auto-repairs/auto-painting',
  'auto electrician': 'auto-repairs/auto-electrical',
  'car electrician': 'auto-repairs/auto-electrical',
  'battery service': 'auto-repairs/auto-electrical',
  'tow truck': 'auto-repairs/towing',
  'towing': 'auto-repairs/towing',
  'vehicle': 'auto-repairs',
  'car': 'auto-repairs',

  // Home Repairs
  'painter': 'home-repairs/painting',
  'house painter': 'home-repairs/painting',
  'interior painter': 'home-repairs/painting',
  'exterior painter': 'home-repairs/painting',
  'painting contractor': 'home-repairs/painting',
  'electrical': 'home-repairs/electrical-repairs',
  'electrician': 'home-repairs/electrical-repairs',
  'electrical repairs': 'home-repairs/electrical-repairs',
  'wiring': 'home-repairs/electrical-repairs',
  'rewiring': 'home-repairs/electrical-repairs',
  'socket repair': 'home-repairs/electrical-repairs',
  'light installation': 'home-repairs/electrical-repairs',
  'plumbing': 'home-repairs/plumbing',
  'plumber': 'home-repairs/plumbing',
  'pipe repair': 'home-repairs/plumbing',
  'pipe fitting': 'home-repairs/plumbing',
  'drain repair': 'home-repairs/plumbing',
  'sink installation': 'home-repairs/plumbing',
  'tiler': 'home-repairs/tiling',
  'tile installer': 'home-repairs/tiling',
  'tiling': 'home-repairs/tiling',
  'flooring': 'home-repairs/tiling',
  'floor installer': 'home-repairs/tiling',
  'handyman': 'home-repairs',
  'home repair': 'home-repairs',
  'repairs': 'home-repairs',

  // Construction
  'builder': 'construction/building',
  'contractor': 'construction/building',
  'construction': 'construction/building',
  'building contractor': 'construction/building',
  'civil engineer': 'construction/building',
  'roofer': 'construction/roofing',
  'roof repair': 'construction/roofing',
  'roofing': 'construction/roofing',
  'mason': 'construction/masonry',
  'bricklayer': 'construction/masonry',
  'block layer': 'construction/masonry',
  'plasterer': 'construction/masonry',
  'cement work': 'construction/masonry',
  'concrete work': 'construction/masonry',

  // Skilled Trades
  'carpenter': 'skilled-trades/carpentry',
  'woodworker': 'skilled-trades/carpentry',
  'joiner': 'skilled-trades/carpentry',
  'cabinet maker': 'skilled-trades/carpentry',
  'furniture maker': 'skilled-trades/carpentry',
  'welder': 'skilled-trades/welding',
  'fabricator': 'skilled-trades/welding',
  'metal work': 'skilled-trades/welding',
  'steel work': 'skilled-trades/welding',
  'blacksmith': 'skilled-trades/welding',
  'ac': 'skilled-trades/ac-repair',
  'aircon': 'skilled-trades/ac-repair',
  'air conditioning': 'skilled-trades/ac-repair',
  'hvac': 'skilled-trades/ac-repair',
  'refrigeration': 'skilled-trades/ac-repair',
  'fridge repair': 'skilled-trades/ac-repair',
  'generator repair': 'skilled-trades/generator-repair',
  'generator mechanic': 'skilled-trades/generator-repair',

  // Cleaning
  'cleaner': 'cleaning/house-cleaning',
  'maid': 'cleaning/house-cleaning',
  'housekeeper': 'cleaning/house-cleaning',
  'janitor': 'cleaning/house-cleaning',
  'domestic worker': 'cleaning/house-cleaning',
  'home cleaning': 'cleaning/house-cleaning',
  'office cleaning': 'cleaning/office-cleaning',
  'laundry': 'cleaning/laundry',
  'dry cleaning': 'cleaning/laundry',
  'washing': 'cleaning/laundry',
  'fumigation': 'cleaning/fumigation',
  'pest control': 'cleaning/fumigation',

  // Events
  'photographer': 'events/photography',
  'photo studio': 'events/photography',
  'videographer': 'events/videography',
  'video coverage': 'events/videography',
  'mc': 'events/mc-hosting',
  'emcee': 'events/mc-hosting',
  'event host': 'events/mc-hosting',
  'decorator': 'events/decoration',
  'event decorator': 'events/decoration',
  'balloon decorator': 'events/decoration',
  'caterer': 'events/catering',
  'chef': 'events/catering',
  'cook': 'events/catering',
  'food vendor': 'events/catering',
  'dj': 'events/music-dj',
  'disc jockey': 'events/music-dj',
  'sound system': 'events/music-dj',
  'live band': 'events/live-band',

  // Beauty & Fashion
  'hairdresser': 'beauty/hair-braiding',
  'hair stylist': 'beauty/hair-braiding',
  'barber': 'beauty/barbing',
  'braider': 'beauty/hair-braiding',
  'makeup artist': 'beauty/makeup',
  'makeup': 'beauty/makeup',
  'nail technician': 'beauty/nails',
  'nails': 'beauty/nails',
  'stylist': 'beauty/fashion-styling',
  'fashion designer': 'beauty/tailoring',
  'tailor': 'beauty/tailoring',
  'seamstress': 'beauty/tailoring',
  'dressmaker': 'beauty/tailoring',

  // Education
  'teacher': 'education/home-tutoring',
  'tutor': 'education/home-tutoring',
  'home tutor': 'education/home-tutoring',
  'private lessons': 'education/home-tutoring',
  'driver': 'education/driving-lessons',
  'driving school': 'education/driving-lessons',
  'driving instructor': 'education/driving-lessons',

  // Tech
  'wifi': 'tech/network-setup',
  'wi-fi': 'tech/network-setup',
  'internet': 'tech/network-setup',
  'networking': 'tech/network-setup',
  'router setup': 'tech/network-setup',
  'cctv': 'tech/cctv-installation',
  'security cameras': 'tech/cctv-installation',
  'camera installation': 'tech/cctv-installation',
  'computer repair': 'tech/laptop-repair',
  'laptop repair': 'tech/laptop-repair',
  'pc repair': 'tech/laptop-repair',
  'phone repair': 'tech/phone-repair',
  'screen replacement': 'tech/phone-repair',
  'software installation': 'tech/software-installation',
  'it support': 'tech/it-support',
  'web designer': 'tech/web-design',
  'website designer': 'tech/web-design',
  'graphic designer': 'tech/graphic-design',
  'designer': 'tech/graphic-design',
};

// Resolve a free-text query to the most specific matching route.
// Returns a full route like "/lucid/services/auto-repairs/engine-repair", or null.
export const resolveSearch = (rawQuery) => {
  const q = (rawQuery || '').trim().toLowerCase();
  if (!q) return null;

  // 1. Exact service name
  for (const cat of ALL_CATEGORIES) {
    for (const svc of cat.services) {
      if (svc.name.toLowerCase() === q) return `/lucid/services/${cat.slug}/${svc.slug}`;
    }
  }
  // 2. Exact category name or slug
  for (const cat of ALL_CATEGORIES) {
    if (cat.name.toLowerCase() === q || cat.slug === q) return `/lucid/services/${cat.slug}`;
  }
  // 3. Synonym / profession map
  if (SEARCH_SYNONYMS[q]) return `/lucid/services/${SEARCH_SYNONYMS[q]}`;

  // 4. Category name contains query — require ≥4 chars to avoid "car"→beauty, "ac"→packing
  if (q.length >= 4) {
    for (const cat of ALL_CATEGORIES) {
      if (cat.name.toLowerCase().includes(q)) return `/lucid/services/${cat.slug}`;
    }
  }
  // 5. Service name contains query (prefix matches like "electric", "plumb", "tailor")
  if (q.length >= 3) {
    for (const cat of ALL_CATEGORIES) {
      for (const svc of cat.services) {
        if (svc.name.toLowerCase().includes(q) || q.includes(svc.name.toLowerCase())) {
          return `/lucid/services/${cat.slug}/${svc.slug}`;
        }
      }
    }
  }
  return null;
};

// Build grouped suggestions for autocomplete dropdown.
// Returns { categories: [...], services: [...] } where each item has a `to` route ready for navigation.
export const buildSuggestions = (rawQuery, { maxCategories = 4, maxServices = 5 } = {}) => {
  const q = (rawQuery || '').trim().toLowerCase();
  if (q.length < 1) return { categories: [], services: [] };

  const categoryMatches = [];
  const serviceMatches = [];
  const seenServiceKeys = new Set();

  for (const cat of ALL_CATEGORIES) {
    const catName = cat.name.toLowerCase();
    const catDesc = (cat.description || '').toLowerCase();
    if (catName.includes(q) || catDesc.includes(q) || cat.slug.includes(q)) {
      categoryMatches.push({
        type: 'category',
        id: `cat-${cat.id}`,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        iconColor: cat.iconColor,
        color: cat.color,
        to: `/lucid/services/${cat.slug}`,
      });
    }

    for (const svc of cat.services) {
      const svcName = svc.name.toLowerCase();
      if (svcName.includes(q)) {
        const key = `${cat.slug}/${svc.slug}`;
        if (seenServiceKeys.has(key)) continue;
        seenServiceKeys.add(key);
        serviceMatches.push({
          type: 'service',
          id: `svc-${key}`,
          name: svc.name,
          icon: cat.icon,
          iconColor: cat.iconColor,
          color: cat.color,
          categoryName: cat.name,
          to: `/lucid/services/${cat.slug}/${svc.slug}`,
        });
      }
    }
  }

  // Synonym hits → route the synonym back to the category/service it maps to.
  for (const [phrase, path] of Object.entries(SEARCH_SYNONYMS)) {
    if (!phrase.includes(q)) continue;
    const [catSlug, svcSlug] = path.split('/');
    const cat = ALL_CATEGORIES.find(c => c.slug === catSlug);
    if (!cat) continue;
    if (svcSlug) {
      const svc = cat.services.find(s => s.slug === svcSlug);
      if (!svc) continue;
      const key = `${catSlug}/${svcSlug}`;
      if (seenServiceKeys.has(key)) continue;
      seenServiceKeys.add(key);
      serviceMatches.push({
        type: 'service',
        id: `syn-${phrase}`,
        name: svc.name,
        synonym: phrase,
        icon: cat.icon,
        iconColor: cat.iconColor,
        color: cat.color,
        categoryName: cat.name,
        to: `/lucid/services/${catSlug}/${svcSlug}`,
      });
    }
  }

  return {
    categories: categoryMatches.slice(0, maxCategories),
    services: serviceMatches.slice(0, maxServices),
  };
};
