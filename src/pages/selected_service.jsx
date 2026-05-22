// URL: /services/cleaning
// Shows all cleaning professionals

// URL: /services/plumbing?area=Accra
// Shows plumbers in Accra

// URL: /services/carpentry?skill=furniture
// Shows carpenters skilled in furniture

import React, { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronDown, Filter, MapPin, Star } from 'lucide-react';
import BusinessCategorySection from '../components/suggested_category.jsx';
import { DownloadSection } from '../components/download_ad.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import { getCategoryBySlug, getServiceBySlug } from '../data/categories.js';
import { supabase } from '../lib/supabaseClient';

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
          <motion.div
            className="mb-4"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <Icon size={46} className="text-white" />
          </motion.div>
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
          <RatingDropdown value={activeFilters.rating} onChange={(v) => onFilterChange('rating', v)} />
        </div>
      )}
    </motion.div>
  );
});

// Stats Bar Component
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
    <div className="relative w-full h-52 md:h-64 bg-gray-300">
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="h-8 w-56 bg-gray-200 rounded-lg" />
        <div className="h-4 w-36 bg-gray-200 rounded" />
      </div>
    </div>
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
      <div className="bg-white dark:bg-[#1a1f2e] rounded-lg shadow-sm p-4 mb-6 flex items-center justify-between">
        <div className="h-5 w-20 bg-gray-200 rounded" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </div>
      <div className="text-center mb-12 space-y-3">
        <div className="h-10 w-80 bg-gray-200 rounded mx-auto" />
        <div className="h-5 w-56 bg-gray-200 rounded mx-auto" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <ProfileCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);

// Build category data from the database categories
const _FEATURED_SLUGS = ['plumbing', 'electrical', 'cleaning', 'painting'];

const SERVICE_ICONS = _FEATURED_SLUGS.map((slug, i) => {
  const cat = getCategoryBySlug(slug);
  return { id: i + 1, icon: cat?.icon || MapPin, name: cat?.name || slug, slug };
});

const BUSINESS_CARDS = Object.fromEntries(
  SERVICE_ICONS.map(({ name, slug }) => {
    const cat = getCategoryBySlug(slug);
    return [name, {
      cat: name,
      slug,
      mainCardBackground: cat?.image,
      cardIcon: cat?.icon,
      heading: cat?.description || `${name} services`,
      seeAll: `See all ${name.toLowerCase()} services`,
    }];
  })
);

const BUSINESS_SERVICES = SERVICE_ICONS.flatMap(({ name, slug }) => {
  const cat = getCategoryBySlug(slug);
  return (cat?.services ?? []).slice(0, 3).map(svc => ({
    cat: name,
    catSlug: slug,
    slug: svc.slug,
    image: svc.image,
    title: svc.name,
    subtitle: 'See workers near you',
  }));
});

// ============================================
// MAIN COMPONENT
// ============================================
const SelectedService = () => {
  const navigate = useNavigate();
  const { category: categorySlug, service: serviceSlug } = useParams();
  const [searchParams] = useSearchParams();
  const { searchLocation } = useSearchLocation();
  const area = searchParams.get('area') || searchLocation.area;

  const catData = getCategoryBySlug(categorySlug);
  const svcData = getServiceBySlug(categorySlug, serviceSlug);
  const skill = svcData?.name ?? serviceSlug ?? categorySlug ?? 'service';

  const [isLoading, setIsLoading] = useState(true);
  const [providers, setProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [filters, setFilters] = useState({ rating: 0 });

  useEffect(() => {
    fetchProviders();
  }, [categorySlug, serviceSlug]);

  const fetchProviders = async () => {
    setLoadingProviders(true);
    try {
      const { data, error } = await supabase
        .from('provider_profiles')
        .select('*')
        .eq('is_profile_complete', true);

      if (error) throw error;

      let filteredProviders = data || [];

      console.log('All providers:', filteredProviders.map(p => ({
        name: `${p.first_name} ${p.last_name}`,
        categories: p.categories,
        skills: p.skills,
        occupation: p.occupation
      })));

      // Category search terms mapping
      const categorySearchTerms = {
        'auto-repairs': ['auto repair', 'auto repairs', 'automotive', 'car repair', 'vehicle repair', 'auto', 'mechanic', 'engine'],
        'home-repairs': ['home repair', 'home repairs', 'house repair', 'maintenance', 'home', 'repair'],
        'electrical': ['electrical', 'electrician', 'wiring', 'circuit', 'electric'],
        'plumbing': ['plumbing', 'plumber', 'pipe', 'water', 'faucet', 'toilet'],
        'cleaning': ['cleaning', 'cleaner', 'house cleaning', 'janitorial', 'maid'],
        'painting': ['painting', 'painter', 'paint', 'house painting'],
        'moving': ['moving', 'mover', 'relocation', 'furniture moving', 'delivery'],
        'construction': ['construction', 'building', 'renovation', 'contractor']
      };

      // Service search terms mapping
      const serviceSearchTerms = {
        'engine-repair': ['engine repair', 'engine', 'auto repair', 'car repair', 'mechanic', 'automotive', 'engine fixing'],
        'electrical-repairs': ['electrical repair', 'electrical', 'electrician', 'wiring', 'circuit', 'electric'],
        'plumbing': ['plumbing', 'plumber', 'pipe', 'water heater', 'faucet', 'toilet repair'],
        'house-cleaning': ['house cleaning', 'cleaning', 'janitorial', 'maid', 'housekeep'],
        'furniture-moving': ['furniture moving', 'moving', 'mover', 'relocation', 'furniture']
      };

      // Filter by category
      if (categorySlug) {
        const searchTerms = categorySearchTerms[categorySlug] || [categorySlug.replace(/-/g, ' ')];
        
        filteredProviders = filteredProviders.filter(provider => {
          const categories = (provider.categories || []).join(' ').toLowerCase();
          const skills = (provider.skills || []).join(' ').toLowerCase();
          const occupation = (provider.occupation || '').toLowerCase();
          
          const searchableText = `${categories} ${skills} ${occupation}`;
          
          const matches = searchTerms.some(term => 
            searchableText.includes(term.toLowerCase())
          );
          
          if (matches) {
            console.log(`✅ Provider ${provider.first_name} matched category ${categorySlug}`);
          }
          return matches;
        });
      }

      // Filter by service
      if (serviceSlug && svcData?.name) {
        const searchTerms = serviceSearchTerms[serviceSlug] || [svcData.name.toLowerCase()];
        
        filteredProviders = filteredProviders.filter(provider => {
          const skills = (provider.skills || []).join(' ').toLowerCase();
          const categories = (provider.categories || []).join(' ').toLowerCase();
          const occupation = (provider.occupation || '').toLowerCase();
          
          const searchableText = `${skills} ${categories} ${occupation}`;
          
          const matches = searchTerms.some(term => 
            searchableText.includes(term.toLowerCase())
          );
          
          if (matches) {
            console.log(`✅ Provider ${provider.first_name} matched service ${svcData.name}`);
          }
          return matches;
        });
      }

      console.log('Filtered providers count:', filteredProviders.length);
      console.log('Filtered providers:', filteredProviders.map(p => ({
        name: `${p.first_name} ${p.last_name}`,
        categories: p.categories,
        skills: p.skills
      })));

      const transformedProviders = filteredProviders.map(provider => ({
        id: provider.user_id,
        name: `${provider.first_name || ''} ${provider.last_name || ''}`.trim() || 'Professional',
        role: provider.occupation || categorySlug || 'Service Provider',
        location: provider.location || 'Accra, Ghana',
        rating: 4.5,
        image: provider.avatar_url,
        verified: false,
        totalJobs: provider.work_experience || 0,
      }));

      setProviders(transformedProviders);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoadingProviders(false);
      setIsLoading(false);
    }
  };

  const filteredProviders = useMemo(() => {
    let filtered = [...providers];
    if (filters.rating > 0) {
      filtered = filtered.filter(p => p.rating >= filters.rating);
    }
    return filtered;
  }, [providers, filters]);

  const stats = useMemo(() => {
    if (filteredProviders.length === 0) return { totalProviders: 0, averageRating: 0 };
    const totalRating = filteredProviders.reduce((sum, p) => sum + p.rating, 0);
    return {
      totalProviders: filteredProviders.length,
      averageRating: (totalRating / filteredProviders.length).toFixed(1)
    };
  }, [filteredProviders]);

  const breadcrumbCrumbs = useMemo(() => [
    { label: 'Home', href: '/lucid/' },
    { label: 'All Services', href: '/lucid/services/all' },
    { label: catData?.name ?? categorySlug, href: `/lucid/services/${categorySlug}` },
    { label: svcData?.name ?? serviceSlug },
  ], [catData, svcData, categorySlug, serviceSlug]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  if (isLoading || loadingProviders) return <SelectedServiceSkeleton />;

  const heroImage = svcData?.image ?? catData?.image ?? 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format';
  const heroTitle = svcData?.name ?? catData?.name ?? skill;
  const heroSubtitle = `${catData?.name ?? 'Lucid'} · Ghana`;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0f1117] pb-20">
      <div className="relative w-full h-52 md:h-64 overflow-hidden">
        <img src={heroImage} alt={heroTitle} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-5 text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">{heroTitle} Services</h1>
          <p className="text-white/80 text-sm">{heroSubtitle}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 pt-4 pb-2">
        <Breadcrumb crumbs={breadcrumbCrumbs} />
      </div>

      <div className="container mx-auto px-6 pb-16">
        <StatsBar totalProviders={stats.totalProviders} averageRating={stats.averageRating} />
        <FilterSection onFilterChange={handleFilterChange} activeFilters={filters} />

        <motion.div className="text-center mb-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} transition={{ duration: 0.6 }}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-slate-200 mb-4">{heroTitle} Services Near You</h2>
          <p className="text-gray-600 dark:text-slate-400 text-lg">
            {area ? `Showing ${filteredProviders.length} professionals in ${area}` : `${filteredProviders.length} verified professionals available`}
          </p>
        </motion.div>

        {filteredProviders.length > 0 ? (
          <motion.div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}>
            {filteredProviders.map((profile, index) => (
              <motion.div key={profile.id} variants={scaleIn} transition={{ duration: 0.3, delay: index * 0.05 }}>
                <ProfileCard
                  id={profile.id}
                  name={profile.name}
                  role={profile.role}
                  location={profile.location}
                  rating={profile.rating}
                  image={profile.image}
                  verified={profile.verified}
                  totalJobs={profile.totalJobs}
                  onViewProfile={() => {
                    console.log('Navigating to provider:', profile.id, profile.name);
                    navigate(`/lucid/providers/${profile.id}`);
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">No providers found</h3>
            <p className="text-gray-600 dark:text-slate-400 mb-6">Try adjusting your filters or check back later for new professionals</p>
            <button onClick={() => setFilters({ rating: 0 })} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Clear Filters</button>
          </motion.div>
        )}
      </div>

      <DownloadSection />
      <motion.div className="w-full" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
        <BusinessCategorySection serviceIcons={SERVICE_ICONS} businessCards={BUSINESS_CARDS} businessServices={BUSINESS_SERVICES} />
      </motion.div>
      <Suspense fallback={null}><BackToTop /></Suspense>
    </div>
  );
};

export default SelectedService;