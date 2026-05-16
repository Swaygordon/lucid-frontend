import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, CheckCircle, CreditCard, Zap, Shield,
  Briefcase, ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Section1 from "./home_sections.jsx";
import BackgroundImage from "../assets/background.png";
import BackToTop from '../components/back_the_top_btn';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// ── Cycling word badge ────────────────────────────────────────────────────────
const SERVICES_CYCLE = ['Electricians', 'Plumbers', 'Cleaners', 'Painters', 'Movers', 'Mechanics'];

const CyclingBadge = () => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % SERVICES_CYCLE.length), 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      className="inline-flex items-center gap-2 bg-blue-600/90 backdrop-blur-sm px-5 py-2 rounded-full mb-6 shadow-lg"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
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
    </motion.div>
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
  return (
    <>
      <div className="flex flex-col lg:min-h-screen bg-white">
        <div
          className="hero flex-1 w-full min-h-[29rem] relative z-10"
          style={{
            backgroundImage: `url(${BackgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Decorative layer */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{ y: [0, -28, 0], x: [0, 18, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-20 -right-20 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl"
            />
            <motion.div
              animate={{ y: [0, 22, 0], x: [0, -14, 0] }}
              transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
              className="absolute bottom-0 -left-16 w-64 h-64 bg-orange-300/15 rounded-full blur-3xl"
            />
            <motion.div
              animate={{ y: [0, -16, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute top-1/3 right-1/4 w-40 h-40 bg-purple-400/10 rounded-full blur-2xl"
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />
          </div>

          <div className="hero-overlay bg-transparent"></div>
          <div className="hero-content w-full text-neutral-content text-center px-4 sm:px-6">
            <div className="w-full max-w-4xl">
              <CyclingBadge />

              <motion.h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl font-extrabold text-black leading-tight mb-4 sm:mb-6"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.6 }}
              >
                Trusted help,<br />
                <span className="block">when and how you need it.</span>
              </motion.h1>

              <motion.p
                className="text-base sm:text-base md:text-lg text-black leading-relaxed mb-8 px-4"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <span className="text-orange-600 font-semibold">Connect</span> with{" "}
                <span className="text-orange-600 font-semibold">trusted workers</span> in
                your neighbourhood for home repairs, cleaning, moving, and more. Get
                started instantly.
              </motion.p>
            </div>
          </div>
        </div>
      </div>

      <ProviderCTA />
      <Section1 />
      <BackToTop />
    </>
  );
}

export default Home;
