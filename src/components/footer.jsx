import React, { memo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from 'react-router-dom';
import {
  FaFacebook,
  FaInstagram,
  FaXTwitter,
  FaYoutube,
  FaThreads
} from 'react-icons/fa6';
import { ArrowRight } from 'lucide-react';
import LogoMark from "../assets/Lucid-L.webp";
import LogoHorizontalBlack from "../assets/Lucid-horizontal black.webp";
import LogoHorizontalWhite from "../assets/Lucid-horizontal white.webp";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const SOCIAL_LINKS = [
  { Icon: FaFacebook,  to: "/lucid/", label: "Facebook" },
  { Icon: FaInstagram, to: "/lucid/", label: "Instagram" },
  { Icon: FaXTwitter,  to: "/lucid/", label: "Twitter" },
  { Icon: FaYoutube,   to: "/lucid/", label: "YouTube" },
  { Icon: FaThreads,   to: "/lucid/", label: "Threads" },
];

const NAVIGATION_LINKS = [
  { to: "/lucid/",         label: "Home" },
  { to: "/lucid/Service",  label: "Services" },
  { to: "/lucid/",         label: "How it works" },
  { to: "/lucid/",         label: "Pricing" },
  { to: "/lucid/",         label: "Safety" },
];

const COMPANY_LINKS = [
  { to: "/lucid/about",                  label: "About us" },
  { to: "/lucid/",                       label: "Contact" },
  { to: "/lucid/",                       label: "Jobs" },
  { to: "/lucid/client_bookings",        label: "Bookings" },
  { to: "/lucid/client_account",         label: "Account" },
];

const LEGAL_LINKS = [
  { to: "/lucid/", label: "Terms of use" },
  { to: "/lucid/", label: "Privacy policy" },
  { to: "/lucid/", label: "Cookie policy" },
];

const FooterLink = memo(({ to, children }) => (
  <Link
    to={to}
    className="text-sm text-gray-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary-light transition-colors"
  >
    {children}
  </Link>
));

const SocialIcon = memo(({ Icon, to, ariaLabel }) => (
  <motion.div whileHover={{ scale: 1.15, y: -2 }} whileTap={{ scale: 0.9 }}>
    <Link
      to={to}
      aria-label={ariaLabel}
      className="inline-flex items-center justify-center w-9 h-9 rounded-full text-primary dark:text-primary-light hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
    >
      <Icon size={20} />
    </Link>
  </motion.div>
));

const Footer = () => {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e) => {
    e.preventDefault();
    // [API] POST /newsletter/subscribe — wire to backend when ready
    setEmail("");
  };

  return (
    <footer className="relative bg-primary dark:bg-[#0f1117] pt-10 sm:pt-24 pb-4 px-4 sm:px-6 lg:px-10 overflow-hidden">
      <motion.div
        className="relative mx-auto max-w-7xl bg-white dark:bg-[#1a1f2e] rounded-2xl sm:rounded-3xl shadow-2xl px-6 sm:px-10 lg:px-14 pt-6 sm:pt-8 pb-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={staggerContainer}
      >
        {/* Top: 4-column content grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand Statement */}
          <motion.div variants={fadeInUp} className="flex flex-col gap-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">
              Lucid Ltd
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed max-w-xs">
              Connecting Ghana with trusted local service providers.
            </p>
            <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed max-w-xs">
              From everyday repairs to skilled professionals — booked in minutes.
            </p>
            <div className="flex flex-wrap items-center gap-1 mt-1">
              {SOCIAL_LINKS.map((s, i) => (
                <SocialIcon key={i} Icon={s.Icon} to={s.to} ariaLabel={s.label} />
              ))}
            </div>
          </motion.div>

          {/* Navigation */}
          <motion.nav variants={fadeInUp} className="flex flex-col gap-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">
              Navigation
            </h3>
            <div className="flex flex-col gap-2.5">
              {NAVIGATION_LINKS.map((link, i) => (
                <FooterLink key={i} to={link.to}>{link.label}</FooterLink>
              ))}
            </div>
          </motion.nav>

          {/* Company */}
          <motion.nav variants={fadeInUp} className="flex flex-col gap-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">
              Company
            </h3>
            <div className="flex flex-col gap-2.5">
              {COMPANY_LINKS.map((link, i) => (
                <FooterLink key={i} to={link.to}>{link.label}</FooterLink>
              ))}
            </div>
          </motion.nav>

          {/* Join Lucid */}
          <motion.div variants={fadeInUp} className="flex flex-col gap-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">
              Join Lucid
            </h3>
            <form onSubmit={handleSubscribe} className="relative w-full max-w-sm">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="type your email"
                className="w-full pl-4 pr-11 py-2.5 text-sm bg-gray-50 dark:bg-[#252b3b] border border-gray-200 dark:border-[#2d3748] rounded-lg text-gray-700 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary transition-colors"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-9 h-9 rounded-md bg-primary hover:bg-primary-hover text-white transition-colors"
              >
                <ArrowRight size={16} />
              </button>
            </form>
            <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed max-w-xs">
              Every booking carries a system behind it. Built to keep your home running.
            </p>
          </motion.div>
        </div>

        {/* Bottom: Large logo — mobile shows the L mark only; desktop shows the horizontal wordmark */}
        <motion.div
          variants={fadeInUp}
          className="mt-6 sm:mt-8 flex items-center justify-center"
        >
          <img
            src={LogoMark}
            alt="Lucid"
            className="block md:hidden h-40 w-auto object-contain"
            width="160"
            height="160"
          />
          <div className="hidden md:block">
            <img
              src={LogoHorizontalBlack}
              alt="Lucid"
              className="block dark:hidden h-32 lg:h-40 w-auto object-contain"
            />
            <img
              src={LogoHorizontalWhite}
              alt="Lucid"
              className="hidden dark:block h-32 lg:h-40 w-auto object-contain"
            />
          </div>
        </motion.div>

        {/* Copyright + legal */}
        <motion.div
          variants={fadeInUp}
          className="mt-4 pt-4 border-t border-gray-100 dark:border-[#2d3748] flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
        >
          <p className="text-xs text-gray-500 dark:text-slate-500 text-center">
            © {new Date().getFullYear()} Lucid Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {LEGAL_LINKS.map((link, i) => (
              <Link
                key={i}
                to={link.to}
                className="text-xs text-gray-500 dark:text-slate-500 hover:text-primary dark:hover:text-primary-light transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </footer>
  );
};

export default memo(Footer);
