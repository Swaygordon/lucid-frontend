import React, { memo } from 'react';
import { ArrowRight, Search, UserRoundPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DownloadSection = memo(() => (
  <section className="my-16 px-4 sm:px-6 lg:px-8">
    <div className="mx-auto grid max-w-7xl gap-6 rounded-3xl bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 p-7 text-white shadow-xl sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-200">Local services, coordinated</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Start with one clear request.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">LUCID reviews your request, coordinates the right next step, and keeps the service record together through payment.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link to="/lucid/services" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-800 hover:bg-blue-50"><Search size={17} aria-hidden="true"/>Browse services<ArrowRight size={16} aria-hidden="true"/></Link>
        <Link to="/lucid/signup" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"><UserRoundPlus size={17} aria-hidden="true"/>Join LUCID</Link>
      </div>
    </div>
  </section>
));
