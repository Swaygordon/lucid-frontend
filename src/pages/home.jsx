import React, { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEllipsisH } from 'react-icons/fa';
import {
  Search, MapPin, CheckCircle, CreditCard, Zap, Shield,
  Briefcase, ArrowRight, Loader2,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ALL_CATEGORIES } from '../data/categories';
import Section1 from "./home_sections.jsx";
import LocationPicker from '../components/LocationPicker.jsx';
import SearchAutocomplete from '../components/SearchAutocomplete.jsx';
import BackToTop from '../components/back_the_top_btn';
import { useTheme } from '../contexts/ThemeContext';
import { resolveSearch } from '../utils/search.js';
import { onActivateKey } from '../utils/a11y';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

// 5 categories with the shortest names, shown beside the "More" button
const FALLBACK_CATEGORIES = [...ALL_CATEGORIES]
  .sort((a, b) => a.name.length - b.name.length)
  .slice(0, 5)
  .map(cat => ({ id: cat.id, name: cat.name, slug: cat.slug, icon: cat.icon }));

// Service Icon Component
const ServiceIcon = memo(
  ({ icon: IconComponent, name, to, isMore = false }) => {
    const navigate = useNavigate();
    return (
      <motion.div
        className="flex flex-col items-center gap-2 flex-shrink-0"
        variants={scaleIn}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.05 }}
      >
        <div
          role="button"
          tabIndex={0}
          aria-label={name}
          className="relative w-16 h-16 cursor-pointer rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          onClick={() => navigate(to)}
          onKeyDown={onActivateKey(() => navigate(to))}
        >
          <div className="absolute top-0 left-6 right-2 w-12 h-12 rounded-lg bg-blue-300" />
          <motion.div
            className="absolute top-3 left-3 w-12 h-12 rounded-lg flex items-center justify-center bg-blue-700 hover:bg-blue-600"
            whileHover={{ rotate: 5, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <IconComponent size={20} className="text-white" />
          </motion.div>
        </div>
        <p className={`text-center text-xs mt-1 whitespace-nowrap ${isMore ? 'text-black dark:text-slate-200' : 'text-blue-700 dark:text-blue-300'}`}>
          {name}
        </p>
      </motion.div>
    );
  }
);

// Search Bar Component
const SearchBar = ({ onSearch, onSelect, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <motion.div
      className="relative z-30 mt-8 sm:mt-12 flex justify-center px-4"
      variants={fadeInUp}
      initial={false}
      animate="visible"
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <div className="relative flex w-full max-w-2xl bg-white dark:bg-white/10 dark:backdrop-blur-md border border-gray-300 dark:border-white/20 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-200 focus-within:ring-2 focus-within:ring-blue-500">
        <SearchAutocomplete
          value={searchTerm}
          onChange={setSearchTerm}
          onSelect={onSelect}
          onSubmit={onSearch}
        >
          {(inputProps) => (
            <input
              {...inputProps}
              type="text"
              placeholder="What service do you need?"
              className="w-full px-5 py-3 text-sm sm:text-base text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 bg-transparent focus:outline-none rounded-l-xl"
            />
          )}
        </SearchAutocomplete>
        {/* Divider + inline location picker */}
        <div className="flex items-center border-l border-gray-200 dark:border-[#2d3748]">
          <LocationPicker inline />
        </div>
        {/* Search button */}
        <motion.button
          aria-label="Search"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 sm:px-7 py-3 rounded-r-xl flex-shrink-0 flex items-center gap-2 transition-colors"
          whileTap={{ scale: 0.97 }}
          onClick={() => onSearch(searchTerm)}
        >
          {isLoading
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : <Search className="w-5 h-5" />
          }
          <span className="hidden sm:inline">Search</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

// Service Icons Grid Component
const ServiceIconsGrid = memo(({ categories = [], className = "" }) => (
  <motion.div
    className={className}
    variants={staggerContainer}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-50px" }}
  >
    {categories.map((cat, index) => (
      <ServiceIcon
        key={cat.id}
        icon={cat.icon}
        name={cat.name}
        to={`/lucid/services/${cat.slug}`}
        index={index}
      />
    ))}
    <ServiceIcon
      icon={FaEllipsisH}
      name="More"
      isMore
      to="/lucid/services/all"
      index={categories.length}
    />
  </motion.div>
));

// Loading skeleton for service icons
const ServiceIconsSkeleton = ({ count = 8, className = "" }) => (
  <div className={className}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
        <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-[#252b3b] animate-pulse" />
        <div className="w-12 h-3 bg-gray-200 dark:bg-[#252b3b] animate-pulse rounded" />
      </div>
    ))}
  </div>
);

// ── Cycling word badge ────────────────────────────────────────────────────────
const SERVICES_CYCLE = ['Electricians', 'Plumbers', 'Cleaners', 'Painters', 'Movers', 'Mechanics'];

const CyclingBadge = () => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % SERVICES_CYCLE.length), 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 bg-blue-600/90 backdrop-blur-sm px-5 py-2 rounded-full mb-6 shadow-lg">
      <MapPin className="w-4 h-4 text-orange-300 flex-shrink-0" />
      <span className="text-white text-sm font-medium">Find trusted</span>
      <div className="overflow-hidden h-5 flex items-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={idx}
            className="text-orange-300 text-sm font-bold block"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            {SERVICES_CYCLE[idx]}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-white text-sm font-medium">near you</span>
    </div>
  );
};

// ── Provider CTA section ──────────────────────────────────────────────────────
const PROVIDER_PERKS = [
  'Free to join — no upfront cost',
  'Set your own rates and schedule',
  'Get paid securely after every job',
  'Build reputation with verified reviews',
];

const PROVIDER_STATS = [
  { label: 'Avg. Monthly Earnings', value: 'GH₵3,200', icon: CreditCard, color: 'from-blue-500 to-blue-700' },
  { label: 'Jobs per Provider',     value: '25 / mo',  icon: Briefcase,  color: 'from-violet-500 to-purple-700' },
  { label: 'Payout Speed',          value: '24 hrs',   icon: Zap,        color: 'from-orange-500 to-amber-600' },
  { label: 'Platform Fee',          value: 'Only 18%', icon: Shield,     color: 'from-emerald-500 to-green-700' },
];

const ProviderCTA = () => (
  <section className="py-20 bg-gradient-to-br from-blue-700 to-indigo-900 relative overflow-hidden">
    <div
      className="absolute inset-0 opacity-[0.04] pointer-events-none"
      style={{
        backgroundImage: 'linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    />
    <div className="relative max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
      {/* Left — feature list */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        <p className="text-orange-400 font-semibold text-sm uppercase tracking-widest">For service providers</p>
        <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
          Grow your business<br />with Lucid
        </h2>
        <p className="text-white/70 text-lg">
          Join thousands of skilled professionals already earning more by connecting with local clients who need their expertise.
        </p>
        <div className="space-y-3 pt-2">
          {PROVIDER_PERKS.map(perk => (
            <div key={perk} className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="text-white/90 text-sm">{perk}</span>
            </div>
          ))}
        </div>
        <Link to="/lucid/become-provider">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="mt-2 flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-orange-500/30 transition-colors"
          >
            Join as a Provider <ArrowRight className="w-5 h-5" />
          </motion.button>
        </Link>
      </motion.div>

      {/* Right — 4 stat cards */}
      <motion.div
        className="grid grid-cols-2 gap-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } } }}
      >
        {PROVIDER_STATS.map(card => (
          <motion.div
            key={card.label}
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            whileHover={{ y: -4 }}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 flex flex-col gap-3"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-md`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-extrabold text-white">{card.value}</p>
            <p className="text-white/60 text-xs font-medium">{card.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────────────────────

function Home() {
  const { isDark } = useTheme();
  const [categories] = useState(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(id);
  }, []);
  const [searchLoading, setSearchLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (searchTerm) => {
    if (!searchTerm.trim()) return;
    // Try to resolve directly to a category/service page before falling back
    // to the Services search-handoff route.
    const resolved = resolveSearch(searchTerm);
    navigate(resolved ?? `/lucid/search?q=${encodeURIComponent(searchTerm.trim())}`);
  };

  const handleSelectSuggestion = (item) => navigate(item.to);

  return (
    <>
      <div className="flex flex-col min-h-screen bg-white dark:bg-[#0f1117]">
        <div
          className="flex flex-col items-center justify-start lg:justify-center flex-1 w-full relative z-10 transition-colors duration-700 pt-8 lg:pt-0"
          style={{
            background: isDark ? [
              'radial-gradient(ellipse at 62% 18%, rgba(29, 78, 216, 0.55) 0%, transparent 52%)',
              'radial-gradient(ellipse at 12% 88%, rgba(234, 88, 12, 0.30) 0%, transparent 48%)',
              'radial-gradient(ellipse at 85% 75%, rgba(109, 40, 217, 0.20) 0%, transparent 40%)',
              'linear-gradient(145deg, #050b18 0%, #07101f 45%, #060c1c 100%)',
            ].join(', ') : 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
          }}
        >
          {/* Decorative layer — overflow-hidden scoped so dropdown can escape */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">

            {/* ── Dark mode: animated glow orbs ── */}
            {isDark && (
              <>
                <motion.div
                  animate={{ y: [0, -28, 0], x: [0, 18, 0] }}
                  transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ willChange: 'transform' }}
                  className="absolute -top-20 -right-20 w-[480px] h-[480px] rounded-full blur-3xl bg-blue-500/50"
                />
                <motion.div
                  animate={{ y: [0, 22, 0], x: [0, -14, 0] }}
                  transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                  style={{ willChange: 'transform' }}
                  className="absolute bottom-0 -left-16 w-80 h-80 rounded-full blur-3xl bg-orange-400/40"
                />
                <motion.div
                  animate={{ y: [0, -16, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  style={{ willChange: 'transform' }}
                  className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full blur-3xl bg-purple-500/30"
                />
                <motion.div
                  animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.8, 0.6] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ willChange: 'transform, opacity' }}
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-blue-700/25 blur-[80px] rounded-full"
                />
              </>
            )}

            {/* Dot grid — both themes (white dots on dark, slate dots on light) */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)'} 1px, transparent 1px)`,
                backgroundSize: '28px 28px',
              }}
            />
          </div>

          <div className="relative z-20 w-full text-center px-4 sm:px-6 py-16 sm:py-20">
            <div className="w-full max-w-3xl mx-auto">
              {/* Cycling word badge */}
              <CyclingBadge />

              {/* Heading */}
              <motion.h1
                className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-4"
                variants={fadeInUp}
                initial={false}
                animate="visible"
                transition={{ duration: 0.6 }}
              >
                Trusted help,{' '}
                <span className="text-blue-600 dark:text-blue-400">when and how</span>{' '}
                you need it.
              </motion.h1>

              {/* Paragraph */}
              <motion.p
                className="text-base md:text-lg text-gray-600 dark:text-slate-300 leading-relaxed mb-8 max-w-xl mx-auto"
                variants={fadeInUp}
                initial={false}
                animate="visible"
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <span className="text-orange-600 font-semibold">Connect</span> with{" "}
                <span className="text-orange-600 font-semibold">trusted workers</span> in
                your neighbourhood for home repairs, cleaning, moving, and more. Get
                started instantly.
              </motion.p>

              {/* Search Bar */}
              <SearchBar onSearch={handleSearch} onSelect={handleSelectSuggestion} isLoading={searchLoading} />

              {/* Desktop/Tablet Category Grid */}
              <div className="hidden md:block mt-14 pb-6 w-full">
                {loading ? (
                  <ServiceIconsSkeleton
                    count={6}
                    className="flex justify-center gap-10"
                  />
                ) : (
                  <ServiceIconsGrid
                    categories={categories}
                    className="flex justify-center gap-10"
                  />
                )}
                <motion.div
                  className="h-px max-w-7xl mx-auto mt-10 mb-10 bg-gray-300 dark:bg-[#1e293b]"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                />
              </div>
            </div>
          </div>

          {/* Mobile Category Scroll — inside hero, shares same background */}
          <motion.div
            className="relative z-10 block md:hidden w-full pb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="overflow-x-auto scrollbar-hide">
              {loading ? (
                <ServiceIconsSkeleton count={6} className="flex gap-6 px-6 pb-2" />
              ) : (
                <ServiceIconsGrid
                  categories={categories}
                  className="flex gap-6 px-6 pb-2"
                />
              )}
            </div>
            <motion.div
              className="h-px max-w-7xl mx-auto mt-6 bg-gray-300 dark:bg-white/10"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            />
          </motion.div>
        </div>
      </div>

      <ProviderCTA />
      <Section1 />
      <BackToTop />
    </>
  );
}

export default Home;
