import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, RefreshCw } from 'lucide-react';
import { supabase } from '../../services/supabaseClient.js';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import ManagedCaseConversation from '../../components/cases/ManagedCaseConversation.jsx';

const OperationsDashboard = () => {
  const { showNotification } = useNotification();
  const [cases, setCases] = useState([]);
  const [inspectors, setInspectors] = useState([]);
  const [selectedInspectorByCase, setSelectedInspectorByCase] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [assigningCaseId, setAssigningCaseId] = useState('');

  const handleCaseStatusChange = (caseId, status) => {
    setCases(current => current.map(item => item.id === caseId ? { ...item, status } : item));
  };

  useEffect(() => {
    let active = true;

    async function loadQueue() {
      try {
        const [caseResult, rosterResult] = await Promise.all([
          supabase
            .from('managed_service_cases')
            .select('id, service_name, description, status, urgency, budget_min, budget_max, currency, preferred_date, preferred_time, created_at')
            .in('status', ['submitted', 'needs_information', 'inspector_assigned', 'inspection_reported'])
            .order('created_at', { ascending: true }),
          supabase
            .from('lucid_inspector_roster')
            .select('user_id, display_name')
            .order('display_name'),
        ]);

        if (caseResult.error) throw caseResult.error;
        if (rosterResult.error) throw rosterResult.error;

        // Operations staff can inspect client contact/location details. This
        // query is still protected by table RLS; providers have no policy here.
        const caseIds = (caseResult.data || []).map(item => item.id);
        let detailsByCaseId = new Map();
        if (caseIds.length > 0) {
          const { data: details, error: detailsError } = await supabase
            .from('managed_case_private_details')
            .select('case_id, region, city, street_address, area, landmark, contact_name, contact_phone, contact_email, additional_notes')
            .in('case_id', caseIds);
          if (detailsError) throw detailsError;
          detailsByCaseId = new Map((details || []).map(item => [item.case_id, item]));
        }

        const inspectionCases = (caseResult.data || []).filter(item => item.status === 'inspection_reported');
        let reportsByCaseId = new Map();

        if (inspectionCases.length > 0) {
          const { data: assignments, error: assignmentError } = await supabase
            .from('inspection_assignments')
            .select('id, case_id')
            .in('case_id', inspectionCases.map(item => item.id));
          if (assignmentError) throw assignmentError;

          if (assignments?.length) {
            const { data: reports, error: reportError } = await supabase
              .from('inspection_reports')
              .select('assignment_id, findings, confirmed_scope, materials_labor_notes, submitted_at')
              .in('assignment_id', assignments.map(item => item.id));
            if (reportError) throw reportError;

            const caseByAssignmentId = new Map(assignments.map(item => [item.id, item.case_id]));
            reportsByCaseId = new Map((reports || []).map(report => [caseByAssignmentId.get(report.assignment_id), report]));
          }
        }

        if (!active) return;
        setCases((caseResult.data || []).map(item => ({
          ...item,
          privateDetails: detailsByCaseId.get(item.id),
          report: reportsByCaseId.get(item.id),
        })));
        setInspectors(rosterResult.data || []);
        setLoadError(false);
      } catch (error) {
        console.error('Unable to load the LUCID operations queue:', error);
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadQueue();
    return () => { active = false; };
  }, [refreshKey]);

  const handleAssignInspector = async caseId => {
    const inspectorUserId = selectedInspectorByCase[caseId];
    if (!inspectorUserId) {
      showNotification('Choose an inspector before assigning this request.', 'warning');
      return;
    }

    setAssigningCaseId(caseId);
    try {
      const { error } = await supabase.rpc('confirm_case_and_assign_inspector', {
        p_case_id: caseId,
        p_inspector_user_id: inspectorUserId,
      });

      if (error) throw error;
      setCases(current => current.map(item => item.id === caseId ? { ...item, status: 'inspector_assigned' } : item));
      showNotification('Request confirmed and inspector assigned.', 'success');
    } catch (error) {
      console.error('Unable to assign the inspector:', error);
      showNotification(error.message || 'The inspector could not be assigned.', 'error');
    } finally {
      setAssigningCaseId('');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-[#0f1117] sm:py-14">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">LUCID operations</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-slate-100">Request review queue</h1>
            <p className="mt-2 text-gray-600 dark:text-slate-400">Review requests, follow client conversations, and monitor inspection reports.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/lucid/admin/workflow" className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 font-semibold text-white transition hover:bg-primary-hover">Operations hub</Link>
            <button
              type="button"
              onClick={() => { setLoading(true); setLoadError(false); setRefreshKey(value => value + 1); }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50 dark:border-[#2d3748] dark:bg-[#1a1f2e] dark:text-slate-200 dark:hover:bg-[#252b3b]"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Refresh queue
            </button>
          </div>
        </header>

        {loading ? (
          <div role="status" className="rounded-2xl bg-white p-8 text-center text-gray-600 shadow-sm dark:bg-[#1a1f2e] dark:text-slate-400">Loading requests…</div>
        ) : loadError ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-white p-8 text-center text-gray-700 dark:border-red-900/50 dark:bg-[#1a1f2e] dark:text-slate-300">
            The request queue could not be loaded. Check your connection and refresh the queue.
          </div>
        ) : cases.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-[#1a1f2e]">
            <ClipboardList className="mx-auto h-11 w-11 text-gray-400" aria-hidden="true" />
            <h2 className="mt-3 text-lg font-semibold text-gray-900 dark:text-slate-100">No requests are waiting for review</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">New client requests will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cases.map(item => (
              <article key={item.id} className="rounded-2xl bg-white p-5 shadow-sm dark:bg-[#1a1f2e] sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{item.service_name}</h2>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
                        {item.status === 'submitted' ? 'Needs review' : item.status === 'needs_information' ? 'Waiting for client' : item.status === 'inspector_assigned' ? 'Inspector assigned' : 'Inspection report ready'}
                      </span>
                      {item.urgency === 'urgent' && <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-800 dark:bg-orange-950/40 dark:text-orange-200">Urgent</span>}
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700 dark:text-slate-300">{item.description}</p>
                    <p className="mt-3 text-sm text-gray-600 dark:text-slate-400">
                      Client range: {item.currency} {Number(item.budget_min).toFixed(2)} – {item.currency} {Number(item.budget_max).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-slate-400 lg:text-right">
                    <p>Received {new Date(item.created_at).toLocaleString()}</p>
                    {item.preferred_date && <p className="mt-1">Preferred: {item.preferred_date}{item.preferred_time ? ` · ${item.preferred_time}` : ''}</p>}
                    <p className="mt-1">Case {item.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
                {item.report && (
                  <section className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
                    <h3 className="font-semibold text-blue-950 dark:text-blue-100">Inspector report</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700 dark:text-slate-300">{item.report.findings}</p>
                    <p className="mt-3 text-sm text-gray-700 dark:text-slate-300"><span className="font-semibold">Confirmed scope:</span> {item.report.confirmed_scope}</p>
                    {item.report.materials_labor_notes && <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700 dark:text-slate-300"><span className="font-semibold">Materials / labor:</span> {item.report.materials_labor_notes}</p>}
                  </section>
                )}
                {item.privateDetails && (
                  <section className="mt-5 rounded-xl bg-gray-50 p-4 dark:bg-[#252b3b]">
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100">Private client details (LUCID staff only)</h3>
                    <p className="mt-2 text-sm text-gray-700 dark:text-slate-300">
                      {item.privateDetails.contact_name} · {item.privateDetails.contact_phone}
                      {item.privateDetails.contact_email ? ` · ${item.privateDetails.contact_email}` : ''}
                    </p>
                    <p className="mt-1 text-sm text-gray-700 dark:text-slate-300">
                      {item.privateDetails.street_address}, {item.privateDetails.area}, {item.privateDetails.city ? `${item.privateDetails.city}, ` : ''}{item.privateDetails.region}
                      {item.privateDetails.landmark ? ` · Near ${item.privateDetails.landmark}` : ''}
                    </p>
                    {item.privateDetails.additional_notes && <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600 dark:text-slate-400">Client notes: {item.privateDetails.additional_notes}</p>}
                  </section>
                )}
                <ManagedCaseConversation
                  caseId={item.id}
                  status={item.status}
                  staffView
                  onStatusChange={handleCaseStatusChange}
                />
                {item.status === 'submitted' && (
                  <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 dark:border-[#2d3748] sm:flex-row sm:items-center sm:justify-end">
                    <select
                      aria-label={`Inspector for case ${item.id.slice(0, 8)}`}
                      value={selectedInspectorByCase[item.id] || ''}
                      onChange={event => setSelectedInspectorByCase(current => ({ ...current, [item.id]: event.target.value }))}
                      className="rounded-xl border-2 border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 dark:border-[#2d3748] dark:bg-[#252b3b] dark:text-slate-200"
                    >
                      <option value="">Choose an inspector</option>
                      {inspectors.map(inspector => (
                        <option key={inspector.user_id} value={inspector.user_id}>{inspector.display_name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleAssignInspector(item.id)}
                      disabled={!inspectors.length || assigningCaseId === item.id}
                      className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {assigningCaseId === item.id ? 'Assigning…' : 'Confirm and assign inspector'}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {/* This queue is limited to LUCID operations roles. Database RLS keeps
            these private details inaccessible to service-provider accounts. */}
      </div>
    </main>
  );
};

export default OperationsDashboard;
