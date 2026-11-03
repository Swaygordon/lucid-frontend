// @backend-handoff-delete Preview-only profile display backed by the local workflow mock.
import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, UserRound } from 'lucide-react';
import { useWorkflowActor, useWorkflowServices } from '../../contexts/WorkflowModeContext.jsx';

export default function PreviewAccountProfilePage() {
  const actor = useWorkflowActor();
  const services = useWorkflowServices();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    services.profiles.getForRole({ role: actor.role, userId: actor.userId }).then(result => {
      if (!active) return;
      if (result.error) setError(result.error.message);
      else setProfile(result.data);
    }).catch(cause => { if (active) setError(cause.message || 'Profile could not be loaded.'); });
    return () => { active = false; };
  }, [services, actor.role, actor.userId]);

  if (!['client', 'provider', 'service_provider'].includes(actor.role)) return <Navigate to={actor.role === 'inspector' ? '/lucid/inspector/profile' : '/lucid/dashboard'} replace />;
  const provider = actor.role !== 'client';
  const fullName = profile?.fullName || 'Preview account';
  const reviews = profile?.reviews || [];
  return <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-[#0f1117] sm:px-6"><div className="mx-auto max-w-4xl space-y-6"><Link to="/lucid/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4"/>Back to dashboard</Link><header className="rounded-3xl bg-white p-7 shadow-sm dark:bg-[#1a1f2e]"><p className="text-sm font-semibold uppercase tracking-wide text-primary">{provider?'Provider':'Client'} Preview profile</p><h1 className="mt-2 text-3xl font-bold text-gray-950 dark:text-slate-100">{fullName}</h1><p className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400"><MapPin className="h-4 w-4"/>{profile?.homeCity && profile?.region ? `${profile.homeCity}, ${profile.region}` : 'Location not set'}</p><Link to={provider?'/lucid/account/profile/setup':'/lucid/client/profile/setup'} className="mt-5 inline-flex rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 dark:border-[#394458] dark:text-slate-100">Edit setup</Link></header>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">{error}</p>}
    {!profile && !error && <p role="status" className="rounded-xl bg-white p-5 text-sm text-gray-600 dark:bg-[#1a1f2e] dark:text-slate-300">Loading profile…</p>}
    {profile && provider && <><section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-[#1a1f2e]"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-gray-950 dark:text-slate-100">Service profile</h2><p className="mt-1 text-sm text-gray-600 dark:text-slate-400">{profile.categories?.join(' · ') || 'No service categories selected'}</p></div><div className="flex items-center gap-1 text-amber-500"><Star className="h-5 w-5 fill-current"/><strong className="text-gray-900 dark:text-slate-100">{profile.averageRating || 'New'}</strong><span className="text-sm text-gray-500 dark:text-slate-400">({profile.reviewCount || 0} reviews)</span></div></div><p className="mt-4 text-sm text-gray-600 dark:text-slate-400">{profile.availability || 'Availability not set'} · {profile.qualifications?.join(', ') || 'Qualifications not listed'}</p></section><section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-[#1a1f2e]"><h2 className="text-lg font-semibold text-gray-950 dark:text-slate-100">Client reviews</h2>{reviews.length ? <ul className="mt-4 divide-y divide-gray-100 dark:divide-[#303a4c]">{reviews.map(review=><li key={review.id} className="py-4 first:pt-0"><p className="text-amber-500" aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}<span className="ml-2 text-sm font-semibold text-gray-700 dark:text-slate-200">{review.rating}/5</span></p>{review.comment && <p className="mt-2 text-sm text-gray-700 dark:text-slate-300">{review.comment}</p>}<p className="mt-2 text-xs text-gray-500 dark:text-slate-400">{new Date(review.submittedAt).toLocaleDateString()}</p></li>)}</ul>:<p className="mt-3 text-sm text-gray-600 dark:text-slate-400">Completed and reviewed work will appear here.</p>}</section></>}
    {profile && !provider && <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-[#1a1f2e]"><div className="flex items-center gap-3"><UserRound className="h-5 w-5 text-primary"/><h2 className="text-lg font-semibold text-gray-950 dark:text-slate-100">Contact details</h2></div><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-gray-500 dark:text-slate-400">Phone</dt><dd className="font-medium text-gray-900 dark:text-slate-100">{profile.phone || 'Not set'}</dd></div><div className="flex justify-between gap-3"><dt className="text-gray-500 dark:text-slate-400">Preferred payment</dt><dd className="font-medium text-gray-900 dark:text-slate-100">{profile.paymentPreference || 'Not set'}</dd></div></dl></section>}
  </div></main>;
}
