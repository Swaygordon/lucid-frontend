import React, { memo, useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Zap, Sparkles, Truck, Droplets, Car, Scissors, Shirt, PaintRoller, ChevronRight } from 'lucide-react';
import ServicesCarousel from '../components/servicePage_carousel.jsx';
import BackToTop from '../components/back_the_top_btn.jsx';
import LocationPicker from '../components/LocationPicker.jsx';
import BusinessCategorySection from '../components/suggested_category.jsx';
import { DownloadSection } from '../components/download_ad.jsx';
import { ALL_CATEGORIES, getCategoryBySlug } from '../data/categories.js';
import Breadcrumb from '../components/Breadcrumb.jsx';
import SearchAutocomplete from '../components/SearchAutocomplete.jsx';
import { resolveSearch } from '../utils/search.js';
import { Hammer, Truck as TruckIcon, Car as CarIcon, HardHat } from 'lucide-react';


// [API] GET /services/popular?region={region}&limit=8 → [{name, slug, icon}]
// Hardcoded until API provides trending/most-searched data
const POPULAR_SERVICES = [
  { icon: Zap,         name: 'Electrician',    slug: 'home-repairs/electrical-repairs' },
  { icon: Sparkles,    name: 'House Cleaning', slug: 'cleaning/house-cleaning' },
  { icon: Truck,       name: 'Moving',         slug: 'moving/furniture-moving' },
  { icon: Droplets,    name: 'Plumber',        slug: 'home-repairs/plumbing' },
  { icon: Car,         name: 'Auto Repair',    slug: 'auto-repairs/engine-repair' },
  { icon: Scissors,    name: 'Hair Braiding',  slug: 'beauty/hair-braiding' },
  { icon: Shirt,       name: 'Tailoring',      slug: 'beauty/tailoring' },
  { icon: PaintRoller, name: 'House Painting', slug: 'home-repairs/painting' },
];

// [API] GET /categories/featured?limit=4 → [{id, name, slug, icon}]
// Hardcoded until admin can configure featured categories
const SERVICE_ICONS = [
  { id: 1, icon: Hammer,   name: 'Home Repairs', slug: 'home-repairs' },
  { id: 2, icon: TruckIcon, name: 'Moving',       slug: 'moving' },
  { id: 3, icon: CarIcon,   name: 'Auto Repairs', slug: 'auto-repairs' },
  { id: 4, icon: HardHat,   name: 'Construction', slug: 'construction' },
];

// Build hero-card data from ALL_CATEGORIES
const BUSINESS_CARDS = Object.fromEntries(
  SERVICE_ICONS.map(({ name, slug }) => {
    const cat = getCategoryBySlug(slug);
    return [name, {
      cat:                name,
      slug,
      mainCardBackground: cat?.image,
      cardIcon:           cat?.icon,
      heading:            cat?.description ?? name,
      seeAll:             `See all ${name.toLowerCase()} services`,
    }];
  })
);

// Build sub-service cards (3 per category) from ALL_CATEGORIES
const BUSINESS_SERVICES = SERVICE_ICONS.flatMap(({ name, slug }) => {
  const cat = getCategoryBySlug(slug);
  return (cat?.services ?? []).slice(0, 3).map(svc => ({
    cat:      name,
    catSlug:  slug,
    slug:     svc.slug,
    image:    svc.image,
    title:    svc.name,
    subtitle: 'See workers near you',
  }));
});

// Build collage image pool: all category images + all service images
const _collagePool = [
  ...ALL_CATEGORIES.map(cat => ({ src: cat.image, label: cat.name })),
  ...ALL_CATEGORIES.flatMap(cat => cat.services.map(s => ({ src: s.image, label: s.name }))),
];
const COLLAGE_ROW1 = _collagePool.slice(0, 16);
const COLLAGE_ROW2 = _collagePool.slice(16, 32);
const COLLAGE_ROW3 = _collagePool.slice(32, 48);

const ServicesSkeleton = () => (
  <div className="w-full min-h-screen bg-gray-50 animate-pulse">
    {/* Hero — 3 stacked rows mimicking the marquee collage */}
    <div className="relative flex flex-col gap-1.5 overflow-hidden" style={{ minHeight: 460 }}>
      <div className="flex-1 bg-gray-300" />
      <div className="flex-1 bg-gray-200" />
      <div className="flex-1 bg-gray-300" />
      <div className="absolute inset-0 bg-blue-950/30" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-5 text-center">
        <div className="h-10 w-64 bg-white/20 rounded-xl" />
        <div className="h-5 w-72 bg-white/20 rounded-lg" />
        <div className="max-w-2xl w-full h-12 bg-white/25 rounded-xl" />
      </div>
    </div>

    {/* Breadcrumb */}
    <div className="max-w-6xl mx-auto px-5 pt-5 pb-1 flex items-center gap-2">
      <div className="h-4 w-10 bg-gray-200 rounded" />
      <div className="h-3 w-3 bg-gray-200 rounded" />
      <div className="h-4 w-16 bg-gray-200 rounded" />
    </div>

    {/* Popular Services */}
    <div className="max-w-6xl mx-auto px-5 py-14">
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 w-56 bg-gray-200 rounded-lg" />
        <div className="h-4 w-16 bg-gray-200 rounded" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-2xl" />
        ))}
      </div>
    </div>

    {/* Carousel strip 1 */}
    <div className="bg-white px-5 py-8">
      <div className="h-5 w-40 bg-gray-200 rounded mb-5" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-64 h-44 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>

    {/* Featured category tabs + card grid */}
    <div className="bg-white px-5 pb-16 pt-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex gap-3 mb-8 flex-wrap">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 w-32 bg-gray-200 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ServiceCard = memo(({ service }) => {
  const Icon = service.icon;
  return (
    <Link to={`/lucid/services/${service.slug}`} className="block h-full">
      <div className="h-full bg-white dark:bg-[#1a1f2e] border border-gray-200 dark:border-[#1e293b] rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-blue-500 hover:shadow-md transition-all duration-200 cursor-pointer group">
        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-primary/10 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-primary/20 transition-colors">
          <Icon size={24} className="text-blue-700" />
        </div>
        <span className="text-gray-800 dark:text-slate-200 text-sm font-medium text-center leading-snug">
          {service.name}
        </span>
      </div>
    </Link>
  );
});

// All services flattened from every category, for the carousels
const ALL_SERVICES_POOL = ALL_CATEGORIES.flatMap(cat =>
  cat.services.map(svc => ({
    name:  svc.name,
    image: svc.image,
    slug:  `/lucid/services/${cat.slug}/${svc.slug}`,
  }))
);

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const Services = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const id = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(id);
  }, []);

  // Auto-resolve ?q= from home page search bar handoff
  useEffect(() => {
    const q = searchParams.get('q');
    if (!q?.trim()) return;
    const route = resolveSearch(q);
    if (route) {
      navigate(route, { replace: true });
    } else {
      setQuery(q.trim()); // no match — pre-fill the input so the user can refine
    }
  }, []);

  // Shuffle once per mount and split into two distinct groups of 5
  const [carousel1, carousel2] = useMemo(() => {
    const pool = shuffle(ALL_SERVICES_POOL);
    return [pool.slice(0, 5), pool.slice(5, 10)];
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    const route = resolveSearch(query);
    navigate(route ?? `/lucid/services/all?q=${encodeURIComponent(query.trim())}`);
  };

  if (isLoading) return <ServicesSkeleton />;

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-[#0f1117]">

      {/* ── Hero ── */}
      <header className="relative z-10" style={{ minHeight: 460 }}>
        <style>{`
          @keyframes marquee-left {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes marquee-right {
            0%   { transform: translateX(-50%); }
            100% { transform: translateX(0); }
          }
          .marquee-left  { animation: marquee-left  linear infinite; }
          .marquee-right { animation: marquee-right linear infinite; }
        `}</style>

        {/* Collage rows — overflow-hidden scoped here so the search dropdown can escape the header */}
        <div className="absolute inset-0 flex flex-col gap-1.5 overflow-hidden">
          {[
            { row: COLLAGE_ROW1, dir: 'marquee-left',  duration: '38s' },
            { row: COLLAGE_ROW2, dir: 'marquee-right', duration: '28s' },
            { row: COLLAGE_ROW3, dir: 'marquee-left',  duration: '44s' },
          ].map(({ row, dir, duration }, ri) => (
            <div key={ri} className="overflow-hidden flex-1">
              <div
                className={`${dir} flex gap-1.5 h-full`}
                style={{ animationDuration: duration, width: 'max-content' }}
              >
                {[...row, ...row].map((img, i) => (
                  <div key={i} className="flex-shrink-0 w-44 md:w-56 h-full overflow-hidden">
                    <img
                      src={img.src}
                      alt={img.label}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-blue-950/65" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-5 py-20" style={{ minHeight: 460 }}>
          <h1 className="text-white text-3xl md:text-5xl font-bold mb-3">
            Lucid is here for you
          </h1>
          <p className="text-blue-200 text-base md:text-lg mb-8">
            Find trusted professionals for any job across Ghana
          </p>
          <form
            onSubmit={handleSearch}
            className="max-w-2xl w-full mx-auto flex bg-white dark:bg-[#252b3b] border border-gray-300 dark:border-[#2d3748] rounded-xl shadow-md focus-within:ring-2 focus-within:ring-blue-500 transition-shadow"
          >
            <SearchAutocomplete
              value={query}
              onChange={setQuery}
              onSelect={(item) => navigate(item.to)}
              onSubmit={(v) => navigate(resolveSearch(v) ?? `/lucid/services/all?q=${encodeURIComponent(v.trim())}`)}
            >
              {(inputProps) => (
                <input
                  {...inputProps}
                  type="text"
                  placeholder="What service do you need?"
                  className="w-full px-5 py-3 text-gray-900 dark:text-slate-200 outline-none text-base bg-transparent rounded-l-xl placeholder-gray-400 dark:placeholder-slate-500"
                />
              )}
            </SearchAutocomplete>
            <div className="flex items-center border-l border-gray-200 dark:border-[#1e293b]">
              <LocationPicker inline />
            </div>
            <button
              type="submit"
              aria-label="Search"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-r-xl flex items-center gap-2 transition-colors flex-shrink-0"
            >
              <Search size={18} />
              <span className="hidden sm:inline">Search</span>
            </button>
          </form>
        </div>
      </header>

      {/* ── Breadcrumb ── */}
      <div className="max-w-6xl mx-auto px-5 pt-5 pb-1">
        <Breadcrumb crumbs={[
          { label: 'Home',     href: '/lucid/' },
          { label: 'Services' },
        ]} />
      </div>

      {/* ── Popular Services ── */}
      <section className="max-w-6xl mx-auto px-5 py-14">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-slate-100">
            Popular services <span className="text-blue-600">near you</span>
          </h2>
          <Link
            to="/lucid/services/all"
            className="group text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm flex items-center gap-1"
          >
            View all <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {POPULAR_SERVICES.map((svc, i) => (
            <ServiceCard key={i} service={svc} />
          ))}
        </div>
      </section>

      {/* ── Carousel 1 ── */}
      <div className="bg-white dark:bg-[#1a1f2e]">
        <ServicesCarousel services={carousel1} />
      </div>

      {/* ── Download ── */}
      <DownloadSection />

      {/* ── Carousel 2 ── */}
      <div className="bg-white dark:bg-[#1a1f2e]">
        <ServicesCarousel services={carousel2} />
      </div>

      {/* ── Featured Category Section ── */}
      <section className="bg-white dark:bg-[#1a1f2e] pb-16">
        <BusinessCategorySection
          serviceIcons={SERVICE_ICONS}
          businessCards={BUSINESS_CARDS}
          businessServices={BUSINESS_SERVICES}
        />
      </section>

      {/* ── All Categories CTA ── */}
      <section className="bg-blue-700 py-14 px-5 text-center">
        <h2 className="text-white text-2xl md:text-3xl font-bold mb-3">
          Browse all service categories
        </h2>
        <p className="text-blue-200 mb-7">10 categories · 50+ services across Ghana</p>
        <Link
          to="/lucid/services/all"
          className="inline-block bg-white text-blue-700 font-bold px-8 py-3 rounded-full hover:bg-blue-50 transition-colors shadow"
        >
          See all categories
        </Link>
      </section>

      <BackToTop />
    </div>
  );
};

export default memo(Services);
