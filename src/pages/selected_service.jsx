// URL: /services/cleaning
// Shows all cleaning professionals

// URL: /services/plumbing?area=Accra
// Shows plumbers in Accra

// URL: /services/carpentry?skill=furniture
// Shows carpenters skilled in furniture

import React, { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ChevronRight, ChevronDown, Filter, MapPin, Star } from 'lucide-react';
import BusinessCategorySection from '../components/suggested_category.jsx';
import { DownloadSection } from '../components/download_ad.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import { getCategoryBySlug, getServiceBySlug } from '../data/categories.js';

// Lazy load heavy components
const BackToTop = lazy(() => import('../components/back_the_top_btn'));

// Import ProfileCard directly (not lazy) since it's needed immediately
import { ProfileCard } from '../components/shared';

import { useSearchLocation } from '../contexts/LocationContext';


// ============================================
// ANIMATION VARIANTS
// ============================================
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 }
};

// ============================================
// MEMOIZED COMPONENTS
// ============================================

// Hero Section Component
const HeroSection = React.memo(({ backgroundImage, icon: Icon, title, subtitle }) => (
  <div className='h-1/2'>
    <div
      className="relative w-full h-96 flex items-center justify-center"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      <motion.div
        className="relative z-10 flex flex-col gap-4 justify-start items-start w-full"
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-3xl px-6 text-left">
          {/* Icon */}
          <motion.div
            className="mb-4"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <Icon size={46} className="text-white" />
          </motion.div>

          {/* Heading */}
          <motion.h1
            className="text-2xl md:text-4xl font-bold text-white leading-tight mb-4 drop-shadow-lg"
            variants={fadeInUp}
            transition={{ delay: 0.2 }}
          >
            {title}
          </motion.h1>
          <motion.p
            className="text-white text-lg md:text-xl drop-shadow-md"
            variants={fadeInUp}
            transition={{ delay: 0.3 }}
          >
            {subtitle}
          </motion.p>
        </div>
      </motion.div>
    </div>
  </div>
));


const RATING_OPTIONS = [
  { value: 0,   label: 'All Ratings'  },
  { value: 4.5, label: '4.5+ Stars'   },
  { value: 4.0, label: '4.0+ Stars'   },
  { value: 3.5, label: '3.5+ Stars'   },
];

const RatingDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected = RATING_OPTIONS.find(o => o.value === value) ?? RATING_OPTIONS[0];

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Minimum Rating</label>
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className={`w-full flex items-center justify-between px-3 py-2.5 border-2 rounded-lg bg-white dark:bg-[#252b3b] text-sm font-medium transition-all ${
          open ? 'border-primary text-primary' : 'border-gray-200 dark:border-[#2d3748] text-gray-700 dark:text-slate-300 hover:border-gray-300'
        }`}
      >
        {selected.label}
        <ChevronDown className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-20 bg-white dark:bg-[#252b3b] border border-gray-100 dark:border-[#1e293b] rounded-xl shadow-xl overflow-hidden w-full">
          {RATING_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1f2e] ${
                value === opt.value ? 'text-primary font-semibold bg-primary/5 dark:bg-primary/10' : 'text-gray-700 dark:text-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Filter Section Component
// [API] Pass filter values as query params: ?sortBy=rating&minRating=4&availability=today&verified=true
const FilterSection = React.memo(({ onFilterChange, activeFilters }) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <motion.div
      className="bg-white dark:bg-[#1a1f2e] rounded-lg shadow-sm p-4 mb-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filters
        </h3>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
        >
          {showFilters ? 'Hide' : 'Show'} Filters
        </button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* [API] Pass as query param: ?minRating=4.0 */}
          <RatingDropdown value={activeFilters.rating} onChange={(v) => onFilterChange('rating', v)} />
        </div>
      )}
    </motion.div>
  );
});

// Stats Bar Component
// [MOCK] totalProviders and averageRating — replace with aggregates from GET /providers response metadata
const StatsBar = React.memo(({ totalProviders, averageRating }) => (
  <motion.div
    className="bg-blue-50 dark:bg-primary/10 rounded-lg p-4 mb-6"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <div className="grid grid-cols-2 gap-4 text-center">
      <div>
        <p className="text-2xl font-bold text-blue-600">{totalProviders}</p>
        <p className="text-sm text-gray-600 dark:text-slate-400">Professionals</p>
      </div>
      <div>
        <p className="text-2xl font-bold text-blue-600 flex items-center justify-center gap-1">
          <Star className="w-5 h-5 fill-blue-600" />
          {averageRating}
        </p>
        <p className="text-sm text-gray-600 dark:text-slate-400">Avg Rating</p>
      </div>
    </div>
  </motion.div>
));

const ProfileCardSkeleton = () => (
  <div className="bg-white dark:bg-[#1a1f2e] rounded-lg shadow-sm p-4 animate-pulse">
    <div className="w-20 h-20 bg-gray-300 dark:bg-[#252b3b] rounded-full mx-auto mb-3" />
    <div className="h-4 bg-gray-300 dark:bg-[#252b3b] rounded mb-2" />
    <div className="h-3 bg-gray-300 dark:bg-[#252b3b] rounded mb-2" />
    <div className="h-3 bg-gray-300 dark:bg-[#252b3b] rounded mb-4" />
    <div className="h-8 bg-gray-300 dark:bg-[#252b3b] rounded" />
  </div>
);

const SelectedServiceSkeleton = () => (
  <div className="min-h-screen bg-gray-100 pb-20 animate-pulse">
    {/* Hero */}
    <div className="relative w-full h-52 md:h-64 bg-gray-300">
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="h-8 w-56 bg-gray-200 rounded-lg" />
        <div className="h-4 w-36 bg-gray-200 rounded" />
      </div>
    </div>

    {/* Breadcrumb */}
    <div className="max-w-6xl mx-auto px-5 pt-4 pb-2 flex items-center gap-2">
      <div className="h-4 w-10 bg-gray-200 rounded" />
      <div className="h-3 w-3 bg-gray-200 rounded" />
      <div className="h-4 w-20 bg-gray-200 rounded" />
      <div className="h-3 w-3 bg-gray-200 rounded" />
      <div className="h-4 w-16 bg-gray-200 rounded" />
      <div className="h-3 w-3 bg-gray-200 rounded" />
      <div className="h-4 w-24 bg-gray-200 rounded" />
    </div>

    <div className="container mx-auto px-6 pb-16">
      {/* Stats bar */}
      <div className="bg-blue-50 dark:bg-primary/10 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          {[0, 1].map(i => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="h-8 w-16 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-[#1a1f2e] rounded-lg shadow-sm p-4 mb-6 flex items-center justify-between">
        <div className="h-5 w-20 bg-gray-200 rounded" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </div>

      {/* Section heading */}
      <div className="text-center mb-12 space-y-3">
        <div className="h-10 w-80 bg-gray-200 rounded mx-auto" />
        <div className="h-5 w-56 bg-gray-200 rounded mx-auto" />
      </div>

      {/* Profile card grid — matches real grid breakpoints */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <ProfileCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);

// ============================================
// STATIC DATA — built from shared categories taxonomy
// ============================================
const _FEATURED_SLUGS = ['home-repairs', 'moving', 'auto-repairs', 'construction'];

const SERVICE_ICONS = _FEATURED_SLUGS.map((slug, i) => {
  const cat = getCategoryBySlug(slug);
  return { id: i + 1, icon: cat.icon, name: cat.name, slug };
});

const BUSINESS_CARDS = Object.fromEntries(
  SERVICE_ICONS.map(({ name, slug }) => {
    const cat = getCategoryBySlug(slug);
    return [name, {
      cat:                name,
      slug,
      mainCardBackground: cat.image,
      cardIcon:           cat.icon,
      heading:            cat.description,
      seeAll:             `See all ${name.toLowerCase()} services`,
    }];
  })
);

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

// ============================================
// MAIN COMPONENT
// ============================================
const SelectedService = () => {
  const { category: categorySlug, service: serviceSlug } = useParams();
  const [searchParams] = useSearchParams();
  const { searchLocation } = useSearchLocation();
  // Explicit ?area= param takes priority; fall back to the active search location.
  const area = searchParams.get('area') || searchLocation.area;

  // Resolve category + service from shared taxonomy
  const catData  = getCategoryBySlug(categorySlug);
  const svcData  = getServiceBySlug(categorySlug, serviceSlug);

  // Skill keyword for provider filtering (use service slug or name)
  const skill = svcData?.name ?? serviceSlug ?? 'service';

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(id);
  }, [categorySlug, serviceSlug]);

  // State for filters
  const [filters, setFilters] = useState({
    rating: 0,
    priceRange: 'all',
  });

  // ============================================
  // FETCH AND FILTER PROVIDERS
  // ============================================
  // [API] GET /providers?serviceId={id}&lat={}&lng={}&radius={} — returns [{id, name, rating, location, verified, availability}]
  const providers = [];

  // ============================================
  // TRANSFORM PROVIDERS TO PROFILE CARD FORMAT
  // ============================================
  const profiles = useMemo(() => {
    return providers.map(provider => ({
      id: provider.id,
      name: provider.fullName,
      role: provider.occupation,
      location: `${provider.location.area}, ${provider.location.city}`,
      rating: provider.rating.overall,
      image: provider.profileImage,
      // Additional data for ProfileCard if needed
      verified: provider.isVerified,
      premium: false,
      responseTime: null,
      totalJobs: provider.workExperience.totalJobs
    }));
  }, [providers]);

  // ============================================
  // CALCULATE STATS
  // ============================================
  // [MOCK] stats — in production derive from API response metadata (total, averageRating fields)
  const stats = useMemo(() => {
    if (profiles.length === 0) {
      return { totalProviders: 0, averageRating: 0 };
    }

    const totalRating = profiles.reduce((sum, p) => sum + p.rating, 0);

    return {
      totalProviders: profiles.length,
      averageRating: (totalRating / profiles.length).toFixed(1)
    };
  }, [profiles]);

  const breadcrumbCrumbs = useMemo(() => [
    { label: 'Home',         href: '/lucid/' },
    { label: 'All Services', href: '/lucid/services/all' },
    { label: catData?.name ?? categorySlug, href: `/lucid/services/${categorySlug}` },
    { label: svcData?.name ?? serviceSlug },
  ], [catData, svcData, categorySlug, serviceSlug]);

  // ============================================
  // FILTER CHANGE HANDLER
  // ============================================
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  if (isLoading) return <SelectedServiceSkeleton />;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0f1117] pb-20">
      {/* Hero */}
      <div className="relative w-full h-52 md:h-64 overflow-hidden">
        <img
          src={svcData?.image ?? catData?.image ?? 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format'}
          alt={svcData?.name ?? skill}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-5 text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">
            {svcData?.name ?? skill} Services
          </h1>
          <p className="text-white/80 text-sm">
            {catData?.name ?? 'Lucid'} · Ghana
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-5 pt-4 pb-2">
        <Breadcrumb crumbs={breadcrumbCrumbs} />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 pb-16">
        {/* Stats Bar */}
        <StatsBar {...stats} />

        {/* Filter Section */}
        <FilterSection
          onFilterChange={handleFilterChange}
          activeFilters={filters}
        />

        {/* Section Header */}
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-slate-200 mb-4">
            {svcData?.name ?? skill} Services Near You
          </h2>
          <p className="text-gray-600 dark:text-slate-400 text-lg">
            {area
              ? `Showing ${profiles.length} professionals in ${area}`
              : `Choose from ${profiles.length} verified professionals`}
          </p>
        </motion.div>

        {/* Profile Cards Grid */}
        {/* [API] GET /providers/:id — fetch full provider profile before navigating to booking; triggered on card click */}
        {profiles.length > 0 ? (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {profiles.map((profile) => (
              <motion.div
                key={profile.id}
                variants={scaleIn}
                transition={{ duration: 0.3 }}
              >
                <ProfileCard
                  {...profile}
                  onViewProfile={() => console.log('View profile:', profile.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          // No Results Found
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
              No providers found
            </h3>
            <p className="text-gray-600 dark:text-slate-400 mb-6">
              Try adjusting your filters or search in a different area
            </p>
            <button
              onClick={() => setFilters({ rating: 0, priceRange: 'all' })}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </motion.div>
        )}
      </div>

      {/* Download Section */}
      <DownloadSection />

      {/* Business Category Section */}
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <BusinessCategorySection
          serviceIcons={SERVICE_ICONS}
          businessCards={BUSINESS_CARDS}
          businessServices={BUSINESS_SERVICES}
        />
      </motion.div>

      {/* Back to Top Button */}
      <Suspense fallback={null}>
        <BackToTop />
      </Suspense>
    </div>
  );
};

export default SelectedService;
