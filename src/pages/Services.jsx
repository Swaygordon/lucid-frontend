import React, { memo, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Zap, Sparkles, Truck, Droplets, Car, Scissors, Shirt, PaintRoller, ChevronRight } from 'lucide-react';
import ServicesCarousel from '../components/servicePage_carousel.jsx';
import BackToTop from '../components/back_the_top_btn.jsx';
import BusinessCategorySection from '../components/suggested_category.jsx';
import { DownloadSection } from '../components/download_ad.jsx';
import { ALL_CATEGORIES, getCategoryBySlug } from '../data/categories.js';
import { Hammer, Truck as TruckIcon, Car as CarIcon, HardHat } from 'lucide-react';

// Popular services — 8 most-searched in Ghana
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

// 4 featured categories for the BusinessCategorySection tab bar
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

const ServiceCard = memo(({ service }) => {
  const Icon = service.icon;
  return (
    <Link to={`/lucid/services/${service.slug}`}>
      <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center gap-3 hover:border-blue-500 hover:shadow-md transition-all duration-200 cursor-pointer group">
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
          <Icon size={24} className="text-blue-700" />
        </div>
        <span className="text-gray-800 text-sm font-medium text-center leading-snug">
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
  const navigate = useNavigate();

  // Shuffle once per mount and split into two distinct groups of 5
  const [carousel1, carousel2] = useMemo(() => {
    const pool = shuffle(ALL_SERVICES_POOL);
    return [pool.slice(0, 5), pool.slice(5, 10)];
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/lucid/services/all?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <header className="relative overflow-hidden" style={{ minHeight: 460 }}>
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

        {/* Collage rows */}
        <div className="absolute inset-0 flex flex-col gap-1.5">
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
          <form onSubmit={handleSearch} className="max-w-xl w-full mx-auto flex rounded-xl overflow-hidden shadow-lg">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="What service do you need?"
              className="flex-1 px-5 py-3 text-gray-900 outline-none text-base bg-white"
            />
            <button
              type="submit"
              className="bg-white px-5 py-3 text-blue-700 hover:text-blue-900 transition-colors flex items-center justify-center"
            >
              <Search size={20} />
            </button>
          </form>
        </div>
      </header>

      {/* ── Popular Services ── */}
      <section className="max-w-6xl mx-auto px-5 py-14">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Popular services <span className="text-blue-600">near you</span>
          </h2>
          <Link
            to="/lucid/services/all"
            className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
          >
            View all <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {POPULAR_SERVICES.map((svc, i) => (
            <ServiceCard key={i} service={svc} />
          ))}
        </div>
      </section>

      {/* ── Carousel 1 ── */}
      <div className="bg-white">
        <ServicesCarousel services={carousel1} />
      </div>

      {/* ── Download ── */}
      <DownloadSection />

      {/* ── Carousel 2 ── */}
      <div className="bg-white">
        <ServicesCarousel services={carousel2} />
      </div>

      {/* ── Featured Category Section ── */}
      <section className="bg-white pb-16">
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
