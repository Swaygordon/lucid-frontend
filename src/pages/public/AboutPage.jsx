import React from 'react';
import { motion } from 'framer-motion';
import {
  Users, Target, Sparkles, Shield, Clock, TrendingUp, CheckCircle,
  ArrowRight, Heart, Zap, Award, MapPin, MessageSquare, CreditCard,
  Star, Bell, BarChart2, FileText, RotateCcw, Smartphone
} from 'lucide-react';
import { Link } from 'react-router-dom';
import BackToTop from '../../components/layout/BackToTopButton.jsx';

// ── Animation variants ────────────────────────────────────────────────────────
const fadeUp  = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };
const scaleIn = { hidden: { opacity: 0, scale: 0.88 }, visible: { opacity: 1, scale: 1 } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const vp = { once: true, margin: '-60px' };

// ── Reusable section heading ──────────────────────────────────────────────────
const SectionHeading = ({ label, title, sub }) => (
  <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} className="text-center mb-16">
    {label && <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-3">{label}</p>}
    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-slate-100 mb-4">{title}</h2>
    {sub && <p className="text-gray-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">{sub}</p>}
  </motion.div>
);

// ── Platform features data ────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: FileText,
    color: 'from-blue-500 to-blue-700',
    title: 'Smart Booking System',
    desc: 'A guided process takes each request through LUCID review, inspection, provider matching, work, client approval and payment. Clients share their needs and expected price range; LUCID coordinates the right provider.',
  },
  {
    icon: MessageSquare,
    color: 'from-violet-500 to-purple-700',
    title: 'In-App Messaging',
    desc: 'Clients message LUCID staff and their Inspector. Providers coordinate with LUCID staff and their assigned Inspector. Separate booking threads keep each conversation with the right people.',
  },
  {
    icon: MapPin,
    color: 'from-emerald-500 to-green-700',
    title: 'LUCID Provider Matching',
    desc: 'LUCID uses the request, inspection findings, service area, and provider availability to find an appropriate provider. The client follows the assignment through one booking timeline.',
  },
  {
    icon: CreditCard,
    color: 'from-orange-500 to-amber-600',
    title: 'Secure Mobile Payments',
    desc: 'The client sees the provider\'s bill, LUCID\'s percentage-based platform charge, and the total before paying in the app. Once payment is confirmed, the provider share and LUCID charge are recorded. The final commission rate will be shown before payment.',
  },
  {
    icon: Shield,
    color: 'from-sky-500 to-cyan-700',
    title: 'Provider Verification',
    desc: 'LUCID reviews provider qualifications and service capabilities before matching a provider to a request. Clients receive the job updates and support they need without browsing private provider accounts.',
  },
  {
    icon: Star,
    color: 'from-amber-400 to-yellow-600',
    title: 'Ratings & Reviews',
    desc: 'Clients can share feedback with LUCID after a job. Feedback is connected to the booking so the team can track service quality and address concerns.',
  },
  {
    icon: RotateCcw,
    color: 'from-rose-500 to-red-700',
    title: 'Cancellation Management',
    desc: 'A client may cancel before a provider accepts without a fee. After acceptance, the documented cancellation-fee and recovery process applies. Clients can contact LUCID Admin with a question or request.',
  },
  {
    icon: BarChart2,
    color: 'from-teal-500 to-emerald-700',
    title: 'Provider Earnings Dashboard',
    desc: 'Providers can review assigned work, submitted bills, LUCID\'s percentage charge, confirmed payouts, and job history from their account.',
  },
  {
    icon: Bell,
    color: 'from-indigo-500 to-blue-700',
    title: 'Smart Notifications',
    desc: 'Booking updates can notify clients, providers, Inspectors, and LUCID Admin when a request needs action, an offer is accepted, a bill is submitted, or payment is confirmed.',
  },
  {
    icon: Zap,
    color: 'from-pink-500 to-rose-600',
    title: 'Price Adjustment Flow',
    desc: 'When unexpected work changes the amount, the provider explains the update and asks the client to approve it. Work pauses until the client responds; unapproved additions are not included in the final bill.',
  },
];

const PLATFORM_STATS = [
  { number: '10K+', label: 'Active Providers', icon: Users },
  { number: '50K+', label: 'Jobs Completed',   icon: CheckCircle },
  { number: '4.8',  label: 'Average Rating',   icon: Award },
  { number: '24/7', label: 'Support',          icon: Clock },
];

const VALUES = [
  { icon: Shield,     title: 'Trust & Safety',   desc: 'LUCID coordinates inspections, provider assignment, private communication, payment confirmation, and client support.',                           color: 'from-blue-500 to-blue-700' },
  { icon: Zap,        title: 'Clear coordination', desc: 'A shared booking timeline shows each person what happens next and who is responsible for the next action.',            color: 'from-orange-500 to-amber-600' },
  { icon: Heart,      title: 'Community First',  desc: 'We create economic opportunity for skilled tradespeople while making quality services accessible to every household.', color: 'from-violet-500 to-purple-700' },
  { icon: TrendingUp, title: 'Transparency',     desc: 'Upfront pricing, no hidden fees, and clear cancellation policies. What you agree to is what you pay.',                color: 'from-teal-500 to-emerald-700' },
];

const TIMELINE = [
  { year: '2023', title: 'Founded',      desc: 'Lucid launched in Accra with 50 verified providers and a vision to fix the broken way people find local services.', icon: Sparkles },
  { year: '2024', title: 'City Rollout', desc: 'Expanded to 15 major cities across Ghana, onboarding over 5,000 providers and completing 20,000+ jobs.',           icon: TrendingUp },
  { year: '2025', title: 'Platform v2',  desc: 'Launched in-app chat, the provider earnings dashboard, map discovery, and the mobile payments integration.',        icon: Target },
  { year: 'Next', title: 'West Africa',  desc: 'Planning expansion into Nigeria, Côte d\'Ivoire, and Senegal — bringing the Lucid model to 300M+ people.',          icon: MapPin },
];

// ── Component ─────────────────────────────────────────────────────────────────
const About = () => (
  <div className="min-h-screen overflow-hidden dark:bg-[#0f1117]">

    {/* Hero */}
    <section className="relative bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ y: [0,-30,0], x: [0,20,0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -right-32 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
        <motion.div animate={{ y: [0,25,0], x: [0,-15,0] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute -bottom-32 -left-32 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
        <motion.div animate={{ y: [0,-18,0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute top-1/2 right-1/3 w-56 h-56 bg-orange-400/10 rounded-full blur-2xl" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-28 md:py-36 text-center space-y-8">
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20"
        >
          <Sparkles className="w-5 h-5 text-orange-300" />
          <span className="font-semibold text-sm">About Lucid</span>
        </motion.div>

        <motion.h1 initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold leading-tight"
        >
          Connecting Communities,
          <span className="block bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
            One Service at a Time
          </span>
        </motion.h1>

        <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration: 0.6, delay: 0.3 }}
          className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto"
        >
          We're building the infrastructure for trusted, local service work — where skilled tradespeople thrive and every household can get quality help.
        </motion.p>

        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-wrap gap-4 justify-center pt-4"
        >
          <Link to="/lucid/services">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 bg-white text-blue-700 px-8 py-4 rounded-xl font-bold shadow-xl hover:shadow-2xl transition-shadow"
            >
              Explore Services <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
          <Link to="/lucid/signup">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-orange-500/30 transition-colors"
            >
              Join as a Provider
            </motion.button>
          </Link>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" className="w-full h-auto fill-gray-50 dark:fill-[#0f1117]">
          <path d="M0,40L80,45C160,50,320,60,480,55C640,50,800,30,960,25C1120,20,1280,35,1360,42L1440,48L1440,80L0,80Z" />
        </svg>
      </div>
    </section>

    {/* Stats */}
    <section className="py-20 bg-gray-50 dark:bg-[#0f1117]">
      <div className="max-w-5xl mx-auto px-4">
        <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-8"
          initial="hidden" whileInView="visible" viewport={vp} variants={stagger}
        >
          {PLATFORM_STATS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={i} variants={scaleIn} whileHover={{ y: -4 }}
                className="flex flex-col items-center gap-3 bg-white dark:bg-[#1a1f2e] rounded-2xl p-6 shadow-md border border-gray-100 dark:border-[#1e293b]"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <p className="text-4xl font-extrabold text-gray-900 dark:text-slate-100">{s.number}</p>
                <p className="text-gray-500 dark:text-slate-400 font-medium text-sm text-center">{s.label}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>

    {/* Our Story */}
    <section className="py-24 bg-white dark:bg-[#1a1f2e]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} className="space-y-6">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest">Our story</p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-slate-100">Why we built Lucid</h2>
            <p className="text-gray-600 dark:text-slate-400 text-lg leading-relaxed">
              Finding a reliable plumber, electrician, or cleaner in Accra meant asking around, hoping for referrals, and praying the person who showed up was trustworthy. Skilled tradespeople had the opposite problem — inconsistent work and no way to build a reputation.
            </p>
            <p className="text-gray-600 dark:text-slate-400 text-lg leading-relaxed">
              Lucid connects clients and skilled providers through a managed service process. LUCID coordinates inspection, matching, communication, and payment so every participant knows what happens next.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              {['Verified Workers', 'Structured Booking', 'Secure Payments', 'Honest Reviews'].map(t => (
                <div key={t} className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-full">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-semibold">{t}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={vp} transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur-lg opacity-15" />
            <div className="relative grid grid-cols-2 gap-4">
              {[
                { label: 'Avg. Response Time', value: '28 min',  color: 'from-blue-500 to-blue-700' },
                { label: 'Repeat Clients',     value: '67%',     color: 'from-violet-500 to-purple-700' },
                { label: 'Provider Rating',    value: '4.8 ★',   color: 'from-orange-500 to-amber-600' },
                { label: 'Jobs This Month',    value: '4,200+',  color: 'from-emerald-500 to-green-700' },
              ].map((card, i) => (
                <motion.div key={i} whileHover={{ y: -4 }}
                  className="bg-white dark:bg-[#252b3b] rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-[#1e293b] flex flex-col gap-2"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-1`}>
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-extrabold text-gray-900 dark:text-slate-100">{card.value}</p>
                  <p className="text-gray-500 dark:text-slate-400 text-xs font-medium">{card.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>

    {/* Platform Features */}
    <section className="py-24 bg-gray-50 dark:bg-[#0f1117]">
      <div className="max-w-7xl mx-auto px-4">
        <SectionHeading
          label="Platform features"
          title="Everything you need, built in"
          sub="Lucid isn't just a directory. Every feature is designed to make the entire job — from discovery to payment — smooth, safe, and transparent."
        />

        <motion.div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          initial="hidden" whileInView="visible" viewport={vp} variants={stagger}
        >
          {FEATURES.map((f, i) => (
            <motion.div key={i} variants={scaleIn} whileHover={{ y: -6 }}
              className="bg-white dark:bg-[#1a1f2e] rounded-2xl p-7 shadow-md border border-gray-100 dark:border-[#1e293b] flex flex-col gap-5"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-md flex-shrink-0`}>
                <f.icon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-slate-100 text-xl mb-3">{f.title}</h3>
                <p className="text-gray-500 dark:text-slate-400 leading-relaxed text-sm">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>

    {/* Core Values */}
    <section className="py-24 bg-white dark:bg-[#1a1f2e]">
      <div className="max-w-6xl mx-auto px-4">
        <SectionHeading label="What drives us" title="Our Core Values" sub="These principles guide every product decision we make at Lucid." />
        <motion.div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          initial="hidden" whileInView="visible" viewport={vp} variants={stagger}
        >
          {VALUES.map((v, i) => (
            <motion.div key={i} variants={scaleIn} whileHover={{ y: -6 }}
              className="bg-white dark:bg-[#252b3b] rounded-2xl p-8 shadow-md border border-gray-100 dark:border-[#1e293b] flex flex-col gap-5"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${v.color} flex items-center justify-center shadow-md`}>
                <v.icon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">{v.title}</h3>
                <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">{v.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>

    {/* Timeline */}
    <section className="py-24 bg-gray-50 dark:bg-[#0f1117]">
      <div className="max-w-4xl mx-auto px-4">
        <SectionHeading label="Our journey" title="From Accra to West Africa" sub="A platform built incrementally, shaped by real feedback from providers and clients." />

        <div className="relative">
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-600 to-purple-600" />
          {TIMELINE.map((item, i) => {
            const Icon  = item.icon;
            const isEven = i % 2 === 0;
            return (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative mb-14"
              >
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 z-10">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className={`ml-24 md:ml-0 ${isEven ? 'md:mr-[52%]' : 'md:ml-[52%]'}`}>
                  <motion.div whileHover={{ y: -3 }}
                    className="bg-white dark:bg-[#1a1f2e] rounded-2xl p-6 shadow-md border-l-4 border-blue-600"
                  >
                    <span className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold mb-3">
                      {item.year}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">{item.title}</h3>
                    <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-24 bg-gradient-to-br from-blue-700 to-indigo-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="relative max-w-4xl mx-auto px-4 text-center space-y-8">
        <motion.h2 initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp}
          className="text-4xl md:text-5xl font-extrabold"
        >
          Ready to experience Lucid?
        </motion.h2>
        <motion.p initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp}
          transition={{ delay: 0.1 }} className="text-xl text-white/70"
        >
          Join thousands of clients and providers already using the platform.
        </motion.p>
        <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp}
          transition={{ delay: 0.2 }} className="flex flex-wrap gap-4 justify-center"
        >
          <Link to="/lucid/services">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 bg-white text-blue-700 px-8 py-4 rounded-xl font-bold shadow-xl"
            >
              Browse Services <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
          <Link to="/lucid/signup">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-orange-500/30 transition-colors"
            >
              Get Started Free
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>

    <BackToTop />
  </div>
);

export default About;
