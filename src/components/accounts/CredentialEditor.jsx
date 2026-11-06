import React from 'react';
import { CREDENTIAL_STATUS_LABELS, CREDENTIAL_TYPE_FALLBACK } from '../../data/catalog/credentialTypes.js';
import { ALL_CATEGORIES } from '../../data/catalog/categories.js';

const fieldClass = 'w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-[#394458] dark:bg-[#252b3b] dark:text-slate-100';

export function CredentialStatusBadge({ status }) {
  const label = CREDENTIAL_STATUS_LABELS[status] || CREDENTIAL_STATUS_LABELS.self_declared;
  const color = status === 'verified' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200' : status === 'rejected' ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-200' : 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>{label}</span>;
}

export default function CredentialEditor({ credentials = [], onChange, onUpload }) {
  const update = (id, patch) => onChange(credentials.map(item => {
    if (item.id !== id) return item;
    const materialEdit = Object.keys(patch).some(key => key !== 'uploadError');
    return { ...item, ...patch, ...(materialEdit ? { verificationStatus: 'self_declared', evidenceObjectKey: null, evidenceName: '' } : {}) };
  }));
  const add = () => onChange([...credentials, { id: `credential-${Date.now()}`, credentialTypeId: '', serviceId: '', issuer: '', level: '', certificateNumber: '', issuedYear: '', expiresAt: '', verificationStatus: 'self_declared' }]);
  return <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-[#293244] dark:bg-[#1a1f2e] sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-gray-950 dark:text-slate-100">Qualifications and credentials <span className="text-sm font-normal text-gray-500">(optional)</span></h2><p className="mt-1 max-w-2xl text-sm text-gray-600 dark:text-slate-400">Add relevant training or licences. Credentials do not gate signup or assignments. Only LUCID staff can verify uploaded evidence.</p></div><button type="button" onClick={add} disabled={credentials.length >= 12} className="min-h-10 rounded-lg border border-primary/30 px-3 py-2 text-sm font-semibold text-primary disabled:opacity-50">Add credential</button></div>
    <p className="mt-3 rounded-lg bg-blue-50 p-3 text-xs leading-relaxed text-blue-900 dark:bg-blue-950/30 dark:text-blue-100">These are provisional names while the managed lookup service is being connected. If a type changes, keep the credential you hold and choose “Other” until the updated list is available.</p>
    <div className="mt-4 space-y-4">{credentials.map(item => <article key={item.id} className="rounded-xl border border-gray-200 p-4 dark:border-[#394458]"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><CredentialStatusBadge status={item.verificationStatus || item.status || 'self_declared'}/><button type="button" onClick={() => onChange(credentials.filter(entry => entry.id !== item.id))} className="text-sm font-semibold text-rose-700 dark:text-rose-300">Remove credential</button></div><div className="grid gap-3 sm:grid-cols-2">
      <label className="space-y-1 text-sm font-medium">Credential type<select className={fieldClass} value={item.credentialTypeId || ''} onChange={event => update(item.id, { credentialTypeId: event.target.value, verificationStatus: 'self_declared' })}><option value="">Choose a type</option>{CREDENTIAL_TYPE_FALLBACK.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}</select></label>
      {item.credentialTypeId === 'other' && <label className="space-y-1 text-sm font-medium">Credential name<input className={fieldClass} value={item.otherTypeLabel || ''} maxLength={160} onChange={event => update(item.id, { otherTypeLabel: event.target.value })}/></label>}
      <label className="space-y-1 text-sm font-medium">Relevant service<select className={fieldClass} value={item.serviceId || ''} onChange={event => update(item.id, { serviceId: event.target.value })}><option value="">Choose a service</option>{ALL_CATEGORIES.flatMap(category => category.services.map(service => <option key={service.id} value={service.id}>{service.name}</option>))}</select></label>
      <label className="space-y-1 text-sm font-medium">Issuing body<input className={fieldClass} value={item.issuer || ''} maxLength={160} onChange={event => update(item.id, { issuer: event.target.value })}/></label>
      <label className="space-y-1 text-sm font-medium">Level, grade, or class<input className={fieldClass} value={item.level || ''} maxLength={100} onChange={event => update(item.id, { level: event.target.value })}/>{item.credentialTypeId === 'nvti-trade-test' && <span className="block text-xs font-normal text-gray-500">Enter the grade as printed on your certificate. Current NVTI grade labels need Admin confirmation.</span>}</label>
      <label className="space-y-1 text-sm font-medium">Certificate or licence number (optional)<input className={fieldClass} value={item.certificateNumber || item.reference || ''} maxLength={120} onChange={event => update(item.id, { certificateNumber: event.target.value })}/></label>
      <label className="space-y-1 text-sm font-medium">Year issued (optional)<input className={fieldClass} type="number" min="1950" max={new Date().getFullYear()} value={item.issuedYear || ''} onChange={event => update(item.id, { issuedYear: event.target.value })}/></label>
      <label className="space-y-1 text-sm font-medium">Expiry date (optional)<input className={fieldClass} type="date" value={item.expiresAt || ''} onChange={event => update(item.id, { expiresAt: event.target.value })}/></label>
      <label className="space-y-1 text-sm font-medium">Certificate evidence (optional)<input className={fieldClass} type="file" accept="image/*,.pdf" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file && !file.type.startsWith('image/') && file.type !== 'application/pdf') { update(item.id, { uploadError: 'Choose a PDF or image file.' }); return; } if (file) { update(item.id, { uploadError: '' }); onUpload?.(item, file); } }}/></label>
      </div>{item.evidenceName && <p className="mt-2 text-xs text-gray-500">Selected file: {item.evidenceName} (not uploaded)</p>}{item.uploadError && <p role="alert" className="mt-2 text-xs text-rose-700">{item.uploadError}</p>}</article>)}</div>
    {!credentials.length && <p className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-600 dark:bg-[#252b3b] dark:text-slate-300">No credentials added. You can still create and use your account without one.</p>}
    <p className="mt-4 text-xs text-gray-500 dark:text-slate-400">Evidence uploads require the secure Supabase Storage integration. Until it is connected, selecting a file will not upload or store it.</p>
  </section>;
}
