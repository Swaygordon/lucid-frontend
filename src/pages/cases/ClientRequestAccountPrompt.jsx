// Routes non-Client account holders to public browsing or Client signup.
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ClipboardList } from 'lucide-react';

export default function ClientRequestAccountPrompt() {
  return <main className="min-h-[60vh] bg-gray-50 px-4 py-12 dark:bg-[#0f1117] sm:px-6">
    <section className="mx-auto max-w-xl rounded-3xl bg-white p-7 text-center shadow-sm dark:bg-[#1a1f2e] sm:p-10">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-primary dark:bg-blue-950/40"><ClipboardList className="h-7 w-7" aria-hidden="true" /></span>
      <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-primary">Request a service</p>
      <h1 className="mt-2 text-2xl font-bold text-gray-950 dark:text-slate-100">Use a Client account to request a service</h1>
      <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-slate-300">You can browse LUCID services with your current account. To send a service request, create a Client account or sign in to your Client account.</p>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <Link to="/lucid/signup?role=client" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary/90">Create a Client account <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        <Link to="/lucid/signin?role=client" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 dark:border-[#394458] dark:text-slate-100 dark:hover:bg-[#252b3b]">Sign in as a Client</Link>
      </div>
      <Link to="/lucid/services" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Continue browsing services</Link>
    </section>
  </main>;
}
