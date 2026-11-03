// @backend-handoff-delete Preview-only notification preference screen and mock persistence.
import React, { useEffect, useState } from 'react';
import { Bell, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWorkflowActor, useWorkflowServices } from '../../contexts/WorkflowModeContext.jsx';

const channels = [
  ['inApp', 'In-app notifications', 'Show workflow updates in your LUCID workspace.'],
  ['email', 'Email', 'Preference placeholder; Preview does not send email.'],
  ['sms', 'SMS', 'Preference placeholder; Preview does not send text messages.'],
];

export default function PreviewNotificationSettingsPage() {
  const actor = useWorkflowActor(); const services = useWorkflowServices();
  const [values, setValues] = useState({ inApp: true, email: true, sms: false, pushEnabled: false, pushPermission: 'default' });
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [saved, setSaved] = useState(false);
  useEffect(() => { let active = true; services.notifications.getPreferences({ role: actor.role, userId: actor.userId }).then(result => { if (!active) return; if (result.error) setError(result.error.message); else setValues({ pushEnabled: false, pushPermission: 'default', ...result.data }); setLoading(false); }).catch(cause => { if (active) { setError(cause.message || 'Preferences could not be loaded.'); setLoading(false); } }); return () => { active = false; }; }, [services, actor.role, actor.userId]);
  const save = async event => { event.preventDefault(); setSaving(true); setSaved(false); const result = await services.notifications.savePreferences(values, { role: actor.role, userId: actor.userId }); if (result.error) setError(result.error.message); else { setError(''); setSaved(true); } setSaving(false); };
  const enablePush = async () => {
    setError(''); setSaved(false);
    if (!('Notification' in window)) { setValues(current => ({ ...current, pushEnabled: false, pushPermission: 'unsupported' })); return; }
    try { const permission = await Notification.requestPermission(); setValues(current => ({ ...current, pushEnabled: permission === 'granted', pushPermission: permission })); }
    catch { setError('The browser could not open its notification permission prompt. In-app notifications remain available.'); }
  };
  const permissionMessage = values.pushPermission === 'denied' ? 'Notifications are blocked in your browser. You can still see every update in the LUCID inbox. Change browser site settings to allow push, then try again.'
    : values.pushPermission === 'granted' ? 'Push permission is enabled. Sensitive request details are not included in Preview notices.'
      : values.pushPermission === 'unsupported' ? 'This browser does not support push permission. In-app notifications remain available.'
        : 'Choose Enable push if you want brief updates when LUCID needs your attention. You can keep using in-app notifications without it.';
  return <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-[#0f1117] sm:px-6"><div className="mx-auto max-w-3xl space-y-5">
    <header className="rounded-3xl bg-white p-6 shadow-sm dark:bg-[#1a1f2e]"><Link to="/lucid/notifications" className="text-sm font-semibold text-primary">← Notifications</Link><p className="mt-4 text-sm font-semibold uppercase tracking-wide text-primary">{actor.role} workspace · Preview</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-bold text-gray-950 dark:text-slate-100"><Bell className="h-7 w-7 text-primary"/>Notification preferences</h1><p className="mt-2 text-sm text-gray-600 dark:text-slate-400">Choose how LUCID may notify you. Push is optional; in-app notices stay available. Preview does not send email or SMS.</p></header>
    <form onSubmit={save} className="rounded-2xl bg-white p-5 shadow-sm dark:bg-[#1a1f2e]">{error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}{loading ? <p role="status" className="py-8 text-center text-sm text-gray-500">Loading preferences…</p> : <>
      <div className="divide-y divide-gray-100 dark:divide-[#303a4c]">{channels.map(([key, title, copy]) => <label key={key} className="flex cursor-pointer items-center justify-between gap-4 py-5 first:pt-2"><span><strong className="block text-sm text-gray-900 dark:text-slate-100">{title}</strong><span className="mt-1 block text-sm text-gray-600 dark:text-slate-400">{copy}</span></span><input type="checkbox" checked={Boolean(values[key])} onChange={event => { setValues(current => ({ ...current, [key]: event.target.checked })); setSaved(false); }} className="h-5 w-5 accent-primary"/></label>)}</div>
      <section className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20"><h2 className="font-semibold text-blue-950 dark:text-blue-100">Optional push alerts</h2><p className="mt-1 text-sm leading-relaxed text-blue-900 dark:text-blue-200">{permissionMessage}</p>{values.pushPermission !== 'granted' && <button type="button" onClick={enablePush} className="mt-3 min-h-10 rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-100 dark:border-blue-800 dark:bg-[#1a1f2e] dark:text-blue-100">{values.pushPermission === 'denied' ? 'Try push permission again' : 'Enable push alerts'}</button>}</section>
      <div className="mt-4 flex flex-wrap items-center gap-4"><button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><Save size={16}/>{saving ? 'Saving…' : 'Save preferences'}</button>{saved && <p role="status" className="text-sm font-medium text-green-700">Preview preferences saved.</p>}</div>
    </>}</form>
  </div></main>;
}
