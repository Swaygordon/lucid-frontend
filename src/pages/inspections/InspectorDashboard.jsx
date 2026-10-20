import React, { useEffect, useState } from 'react';
import { ClipboardCheck, MapPin, Phone, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient.js';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import { useWorkflowActor, useWorkflowServices } from '../../contexts/WorkflowModeContext.jsx';

const InspectorVisitCard = ({ visit, onReported }) => {
  const { showNotification } = useNotification();
  const [report, setReport] = useState({ findings: '', confirmedScope: '', materialsLaborNotes: '' });
  const [saving, setSaving] = useState(false);
  const item = visit.serviceCase;
  const details = visit.privateDetails;

  const handleChange = event => {
    const { name, value } = event.target;
    setReport(current => ({ ...current, [name]: value }));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase.rpc('submit_inspection_report', {
        p_assignment_id: visit.id,
        p_findings: report.findings.trim(),
        p_confirmed_scope: report.confirmedScope.trim(),
        p_materials_labor_notes: report.materialsLaborNotes.trim() || null,
      });

      if (error) throw error;
      onReported(visit.id, { ...report, submitted_at: new Date().toISOString() });
      showNotification('Inspection report sent to LUCID.', 'success');
    } catch (error) {
      console.error('Inspection report could not be submitted:', error);
      showNotification(error.message || 'The inspection report could not be submitted.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm dark:bg-[#1a1f2e] sm:p-7">
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-4 dark:border-[#2d3748] sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">{item.service_name}</h2>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
              {visit.status.replaceAll('_', ' ')}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">Case {item.id.slice(0, 8).toUpperCase()} · Assigned {new Date(visit.assigned_at).toLocaleDateString()}</p>
        </div>
        {item.preferred_date && <p className="text-sm text-gray-600 dark:text-slate-400">Preferred: {item.preferred_date}{item.preferred_time ? ` · ${item.preferred_time}` : ''}</p>}
      </div>

      <div className="grid gap-5 pt-5 md:grid-cols-2">
        <section>
          <h3 className="font-semibold text-gray-900 dark:text-slate-100">Reported issue</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700 dark:text-slate-300">{item.description}</p>
        </section>
        <section className="rounded-xl bg-gray-50 p-4 dark:bg-[#252b3b]">
          <h3 className="font-semibold text-gray-900 dark:text-slate-100">Private visit details</h3>
          <p className="mt-2 flex items-start gap-2 text-sm text-gray-700 dark:text-slate-300">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>{details.street_address}, {details.area}, {details.city ? `${details.city}, ` : ''}{details.region}{details.landmark ? ` · Near ${details.landmark}` : ''}</span>
          </p>
          <p className="mt-3 text-sm text-gray-700 dark:text-slate-300">Client contact: {details.contact_name}</p>
          <a href={`tel:${details.contact_phone}`} className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            <Phone className="h-4 w-4" aria-hidden="true" /> {details.contact_phone}
          </a>
        </section>
      </div>

      {visit.status === 'report_submitted' ? (
        <section className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <h3 className="font-semibold text-emerald-900 dark:text-emerald-200">Report sent to LUCID</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700 dark:text-slate-300">{visit.report?.findings}</p>
          <p className="mt-3 text-sm text-gray-700 dark:text-slate-300"><span className="font-semibold">Confirmed scope:</span> {visit.report?.confirmed_scope || visit.report?.confirmedScope}</p>
          {(visit.report?.materials_labor_notes || visit.report?.materialsLaborNotes) && (
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700 dark:text-slate-300"><span className="font-semibold">Materials / labor notes:</span> {visit.report.materials_labor_notes || visit.report.materialsLaborNotes}</p>
          )}
        </section>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 border-t border-gray-100 pt-5 dark:border-[#2d3748]">
          <h3 className="font-semibold text-gray-900 dark:text-slate-100">Inspection report for LUCID</h3>
          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
            Findings
            <textarea name="findings" value={report.findings} onChange={handleChange} required maxLength={4000} rows={3} className="rounded-xl border-2 border-gray-300 bg-white px-4 py-3 outline-none focus:border-primary dark:border-[#2d3748] dark:bg-[#252b3b] dark:text-slate-200" />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
            Confirmed work scope
            <textarea name="confirmedScope" value={report.confirmedScope} onChange={handleChange} required maxLength={4000} rows={3} className="rounded-xl border-2 border-gray-300 bg-white px-4 py-3 outline-none focus:border-primary dark:border-[#2d3748] dark:bg-[#252b3b] dark:text-slate-200" />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
            Materials and labor observations (optional)
            <textarea name="materialsLaborNotes" value={report.materialsLaborNotes} onChange={handleChange} maxLength={3000} rows={2} className="rounded-xl border-2 border-gray-300 bg-white px-4 py-3 outline-none focus:border-primary dark:border-[#2d3748] dark:bg-[#252b3b] dark:text-slate-200" />
          </label>
          <p className="text-sm text-gray-600 dark:text-slate-400">This report records the inspection scope. It does not approve a final invoice or mark the job complete.</p>
          <button type="submit" disabled={saving} className="rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? 'Sending report…' : 'Send report to LUCID'}
          </button>
        </form>
      )}
    </article>
  );
};

const InspectorDashboard = () => {
  const actor = useWorkflowActor();
  const workflowServices = useWorkflowServices();
  const [previewCases, setPreviewCases] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadVisits() {
      try {
        if (actor.mode === 'preview') {
          const result = await workflowServices.cases.listForRole({ role: actor.role, userId: actor.userId });
          if (result.error) throw result.error;
          if (active) { setPreviewCases(result.data || []); setLoadError(false); }
          return;
        }
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('Please sign in again to view your assigned visits.');

        const { data: assignments, error: assignmentError } = await supabase
          .from('inspection_assignments')
          .select('id, case_id, status, assigned_at')
          .eq('inspector_user_id', user.id)
          .neq('status', 'cancelled')
          .order('assigned_at', { ascending: true });

        if (assignmentError) throw assignmentError;
        if (!assignments?.length) {
          if (active) {
            setVisits([]);
            setLoadError(false);
          }
          return;
        }

        const caseIds = assignments.map(item => item.case_id);
        const assignmentIds = assignments.map(item => item.id);
        const [caseResult, detailsResult, reportResult] = await Promise.all([
          supabase
            .from('managed_service_cases')
            .select('id, service_name, description, preferred_date, preferred_time')
            .in('id', caseIds),
          supabase
            .from('managed_case_private_details')
            .select('case_id, region, city, street_address, area, landmark, contact_name, contact_phone')
            .in('case_id', caseIds),
          supabase
            .from('inspection_reports')
            .select('id, assignment_id, findings, confirmed_scope, materials_labor_notes, submitted_at')
            .in('assignment_id', assignmentIds),
        ]);

        if (caseResult.error) throw caseResult.error;
        if (detailsResult.error) throw detailsResult.error;
        if (reportResult.error) throw reportResult.error;

        const casesById = new Map((caseResult.data || []).map(item => [item.id, item]));
        const detailsByCaseId = new Map((detailsResult.data || []).map(item => [item.case_id, item]));
        const reportsByAssignmentId = new Map((reportResult.data || []).map(item => [item.assignment_id, item]));

        if (active) {
          setVisits(assignments.map(assignment => ({
            ...assignment,
            serviceCase: casesById.get(assignment.case_id),
            privateDetails: detailsByCaseId.get(assignment.case_id),
            report: reportsByAssignmentId.get(assignment.id),
          })).filter(visit => visit.serviceCase && visit.privateDetails));
          setLoadError(false);
        }
      } catch (error) {
        console.error('Unable to load inspector visits:', error);
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadVisits();
    return () => { active = false; };
  }, [refreshKey, actor.mode, actor.role, actor.userId, workflowServices]);

  const handleReported = (assignmentId, report) => {
    setVisits(current => current.map(visit => visit.id === assignmentId
      ? { ...visit, status: 'report_submitted', report }
      : visit));
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-[#0f1117] sm:py-14">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">LUCID field team</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-slate-100">Assigned visits</h1>
            <p className="mt-2 text-gray-600 dark:text-slate-400">Review the service issue and contact details needed for your assigned visit.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/lucid/inspector/profile" className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-700 dark:border-[#2d3748] dark:bg-[#1a1f2e] dark:text-slate-200">My profile</Link><Link to="/lucid/inspector/finance" className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-700 dark:border-[#2d3748] dark:bg-[#1a1f2e] dark:text-slate-200">Financial history</Link><Link to="/lucid/messages" className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 font-semibold text-white">Messages</Link>
            <button type="button" onClick={() => { setLoading(true); setLoadError(false); setRefreshKey(value => value + 1); }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50 dark:border-[#2d3748] dark:bg-[#1a1f2e] dark:text-slate-200 dark:hover:bg-[#252b3b]">
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh visits
            </button>
          </div>
        </header>

        {actor.mode === 'preview' ? (
          <div className="space-y-4">{previewCases.length === 0 ? <p className="rounded-2xl bg-white p-8 text-gray-600 dark:bg-[#1a1f2e] dark:text-slate-300">No sample assignments. Admin assignments in this shared browser preview appear here.</p> : previewCases.map(item => <article key={item.id} className="rounded-2xl bg-white p-5 shadow-sm dark:bg-[#1a1f2e]"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-gray-900 dark:text-slate-100">{item.service || item.service_name}</h2><p className="mt-1 text-sm text-gray-500">{item.id} ? {String(item.status).replaceAll('_', ' ')}</p><p className="mt-2 text-sm text-gray-600 dark:text-slate-300">{item.description || item.scope || 'Review the case and coordinate with LUCID.'}</p></div><Link to={`/lucid/cases/${item.id}`} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white">Open case</Link></div></article>)}</div>
        ) : loading ? (
          <div role="status" className="rounded-2xl bg-white p-8 text-center text-gray-600 shadow-sm dark:bg-[#1a1f2e] dark:text-slate-400">Loading assigned visits…</div>
        ) : loadError ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-white p-8 text-center text-gray-700 dark:border-red-900/50 dark:bg-[#1a1f2e] dark:text-slate-300">Your visits could not be loaded. Refresh or contact LUCID operations.</div>
        ) : visits.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-[#1a1f2e]">
            <ClipboardCheck className="mx-auto h-11 w-11 text-gray-400" aria-hidden="true" />
            <h2 className="mt-3 text-lg font-semibold text-gray-900 dark:text-slate-100">No visits assigned</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">New assignments from LUCID will appear here.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {visits.map(visit => <InspectorVisitCard key={visit.id} visit={visit} onReported={handleReported} />)}
          </div>
        )}
      </div>
    </main>
  );
};

export default InspectorDashboard;
