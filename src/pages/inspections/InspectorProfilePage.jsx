import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWorkflowActor, useWorkflowServices } from '../../contexts/WorkflowModeContext.jsx';

const InspectorProfilePage = () => {
  const actor = useWorkflowActor();
  const services = useWorkflowServices();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { let active = true; services.profiles.getForRole({ role: actor.role, userId: actor.userId }).then(result => { if (!active) return; if (result.error) setError(result.error.message); else setProfile(result.data); }); return () => { active = false; }; }, [services, actor.role, actor.userId]);
  return <main className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-[#0f1117]"><div className="mx-auto max-w-3xl"><Link to="/lucid/inspector/visits" className="text-sm font-semibold text-primary">← Inspector workspace</Link><h1 className="mt-4 text-3xl font-bold text-gray-950 dark:text-slate-100">Inspector profile</h1><p className="mt-2 text-gray-600 dark:text-slate-400">Your private LUCID staff profile. It is visible to you and authorized Admin staff.</p>{error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}{profile && <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm dark:bg-[#1a1f2e]"><p className="font-semibold text-gray-900 dark:text-slate-100">Inspector account</p><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><dt className="text-gray-500">Role</dt><dd className="font-medium">Inspector</dd></div><div className="flex justify-between"><dt className="text-gray-500">Profile source</dt><dd className="font-medium">{profile.preview ? 'Synthetic preview profile' : 'Staff account'}</dd></div><div className="flex justify-between"><dt className="text-gray-500">Editing</dt><dd className="font-medium">{profile.editable ? 'Available' : 'Read only until staff profile integration'}</dd></div></dl></section>}</div></main>;
};
export default InspectorProfilePage;
