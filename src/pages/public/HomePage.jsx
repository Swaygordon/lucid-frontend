// Public landing page; authenticated requests start through the Client account.
import React, { memo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaEllipsisH } from "react-icons/fa";
import {
  Search,
  MapPin,
  ArrowRight,
  Loader2,
  Wrench,
  ClipboardCheck,
  MessageCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ALL_CATEGORIES } from "../../data/catalog/categories.js";
import Section1 from "../../components/home/LandingSections.jsx";
import LocationPicker from "../../components/catalog/LocationPicker.jsx";
import SearchAutocomplete from "../../components/catalog/SearchAutocomplete.jsx";
import BackToTop from "../../components/shared/BackToTopButton.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { resolveSearch } from "../../utils/catalog/search.js";
import { onActivateKey } from "../../utils/a11y.js";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

// 5 categories with the shortest names, shown beside the "More" button
const FALLBACK_CATEGORIES = [...ALL_CATEGORIES]
  .sort((a, b) => a.name.length - b.name.length)
  .slice(0, 5)
  .map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    icon: cat.icon,
  }));

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
        <p
          className={`text-center text-xs mt-1 whitespace-nowrap ${isMore ? "text-black dark:text-slate-200" : "text-blue-700 dark:text-blue-300"}`}
        >
          {name}
        </p>
      </motion.div>
    );
  },
);

// Search Bar Component
const SearchBar = ({ onSearch, onSelect, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState("");

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
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
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

// Cycling word badge.
const SERVICES_CYCLE = [
  "Electricians",
  "Plumbers",
  "Cleaners",
  "Painters",
  "Mechanics",
];

const CyclingBadge = () => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setIdx((i) => (i + 1) % SERVICES_CYCLE.length),
      2200,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 mb-6">
      <span className="text-gray-800 dark:text-slate-100 text-sm font-medium">
        Find trusted
      </span>
      <div className="overflow-hidden h-5 flex items-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={idx}
            className="text-blue-700 dark:text-blue-300 text-sm font-bold block"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            {SERVICES_CYCLE[idx]}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-gray-800 dark:text-slate-100 text-sm font-medium">
        near you
      </span>
    </div>
  );
};

//Provider CTA section
const RECRUITMENT_ROLES = [
  {
    role: "Service providers",
    title: "Bring your skills to local jobs",
    description:
      "Get considered for service requests that match your work and location. Keep job details and client communication in LUCID.",
    icon: Wrench,
    steps: [
      "Set up your work profile and service areas",
      "Review an assignment and confirm you can take it",
      "Complete the work, then send the client your final bill",
    ],
    to: "/lucid/become-provider",
    cta: "Join as a Provider",
    accent: "text-blue-700 dark:text-blue-300",
    iconStyle: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
  {
    role: "Inspectors",
    title: "Help requests get off to a good start",
    description:
      "Assess a request on site, clarify the client�s needs, and give LUCID the findings needed to plan the next step.",
    icon: ClipboardCheck,
    steps: [
      "Set up your qualifications and service area",
      "Review assigned requests and assess the site",
      "Record findings and clarify details through LUCID",
    ],
    to: "/lucid/signup?role=inspector",
    cta: "Join as an Inspector",
    accent: "text-orange-700 dark:text-orange-300",
    iconStyle:
      "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  },
];

const RecruitmentSection = () => (
  <section className="py-16 md:py-20 bg-slate-50 dark:bg-slate-950">
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="mx-auto mb-9 max-w-2xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
          Work with LUCID
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
          Good work starts with a clear process
        </h2>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Choose the role that fits you. LUCID coordinates requests,
          communication, and next steps.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {RECRUITMENT_ROLES.map(
          ({
            role,
            title,
            description,
            icon: Icon,
            steps,
            to,
            cta,
            accent,
            iconStyle,
          }) => (
            <article
              key={role}
              className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
            >
              <div className="mb-5 flex items-center gap-3">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconStyle}`}
                  aria-hidden="true"
                >
                  <Icon className="h-5 w-5" />
                </span>
                <p
                  className={`text-sm font-semibold uppercase tracking-wide ${accent}`}
                >
                  {role}
                </p>
              </div>
              <h3 className="text-2xl font-bold text-slate-950 dark:text-white">
                {title}
              </h3>
              <p className="mt-3 min-h-[3.5rem] leading-relaxed text-slate-600 dark:text-slate-300">
                {description}
              </p>
              <ol className="my-6 space-y-3 border-t border-slate-100 pt-5 dark:border-slate-800">
                {steps.map((step, index) => (
                  <li
                    key={step}
                    className="flex items-start gap-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-auto flex flex-col gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Work updates stay in LUCID
                </span>
                <Link
                  to={to}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-500 dark:focus-visible:ring-offset-slate-900"
                >
                  {cta}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </article>
          ),
        )}
      </div>
      <p className="mx-auto mt-5 max-w-3xl text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        Assignments depend on service needs, location, and role requirements.
        Joining does not guarantee a particular number of jobs or earnings.
      </p>
    </div>
  </section>
);
function Home() {
  const { isDark } = useTheme();
  const categories = FALLBACK_CATEGORIES;
  const searchLoading = false;
  const navigate = useNavigate();

  const handleSearch = (searchTerm) => {
    if (!searchTerm.trim()) return;
    // Try to resolve directly to a category/service page before falling back
    // to the Services search-handoff route.
    const resolved = resolveSearch(searchTerm);
    navigate(
      resolved ?? `/lucid/search?q=${encodeURIComponent(searchTerm.trim())}`,
    );
  };

  const handleSelectSuggestion = (item) => navigate(item.to);

  return (
    <>
      <div className="flex flex-col min-h-screen bg-white dark:bg-[#0f1117]">
        <div
          className="flex flex-col items-center justify-start lg:justify-center flex-1 w-full relative z-10 transition-colors duration-700 pt-8 lg:pt-0"
          style={{
            background: isDark
              ? [
                  "radial-gradient(ellipse at 62% 18%, rgba(29, 78, 216, 0.55) 0%, transparent 52%)",
                  "radial-gradient(ellipse at 12% 88%, rgba(234, 88, 12, 0.30) 0%, transparent 48%)",
                  "radial-gradient(ellipse at 85% 75%, rgba(109, 40, 217, 0.20) 0%, transparent 40%)",
                  "linear-gradient(145deg, #050b18 0%, #07101f 45%, #060c1c 100%)",
                ].join(", ")
              : "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)",
          }}
        >
          {/* Decorative layer overflow-hidden scoped so dropdown can escape */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Dark mode: animated glow orbs */}
            {isDark && (
              <>
                <motion.div
                  animate={{ y: [0, -28, 0], x: [0, 18, 0] }}
                  transition={{
                    duration: 9,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{ willChange: "transform" }}
                  className="absolute -top-20 -right-20 w-[480px] h-[480px] rounded-full blur-3xl bg-blue-500/50"
                />
                <motion.div
                  animate={{ y: [0, 22, 0], x: [0, -14, 0] }}
                  transition={{
                    duration: 11,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2,
                  }}
                  style={{ willChange: "transform" }}
                  className="absolute bottom-0 -left-16 w-80 h-80 rounded-full blur-3xl bg-orange-400/40"
                />
                <motion.div
                  animate={{ y: [0, -16, 0] }}
                  transition={{
                    duration: 7,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                  style={{ willChange: "transform" }}
                  className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full blur-3xl bg-purple-500/30"
                />
                <motion.div
                  animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.8, 0.6] }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{ willChange: "transform, opacity" }}
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-blue-700/25 blur-[80px] rounded-full"
                />
              </>
            )}

            {/* Dot grid both themes (white dots on dark, slate dots on light) */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle, ${isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.08)"} 1px, transparent 1px)`,
                backgroundSize: "28px 28px",
              }}
            />
          </div>

          <div className="relative z-20 w-full text-center px-4 sm:px-6 py-16 sm:py-20">
            <div className="w-full max-w-3xl mx-auto">
              {/*Cycling word badge. */}
              <CyclingBadge />

              {/* Heading */}
              <motion.h1
                className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-4"
                variants={fadeInUp}
                initial={false}
                animate="visible"
                transition={{ duration: 0.6 }}
              >
                Trusted help,{" "}
                <span className="text-blue-600 dark:text-blue-400">
                  when and how
                </span>{" "}
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
                Tell LUCID what you need. We coordinate a{" "}
                <span className="text-orange-600 font-semibold">
                  trusted local provider
                </span>{" "}
                for plumbing, electrical work, auto repairs, cleaning,
                carpentry, construction, and handyman jobs.
              </motion.p>

              {/* Search Bar */}
              <SearchBar
                onSearch={handleSearch}
                onSelect={handleSelectSuggestion}
                isLoading={searchLoading}
              />

              {/* Desktop/Tablet Category Grid */}
              <div className="hidden md:block mt-14 pb-6 w-full">
                <ServiceIconsGrid
                  categories={categories}
                  className="flex justify-center gap-10"
                />
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

          {/* Mobile Category Scroll inside hero, shares same background */}
          <motion.div
            className="relative z-10 block md:hidden w-full pb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="overflow-x-auto scrollbar-hide">
              <ServiceIconsGrid
                categories={categories}
                className="flex gap-6 px-6 pb-2"
              />
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

      <RecruitmentSection />
      <Section1 />
      <BackToTop />
    </>
  );
}

export default Home;
