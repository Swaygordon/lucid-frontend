import React, { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { supabase } from '../../services/supabaseClient.js';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import { useWorkflowActor, useWorkflowServices } from '../../contexts/WorkflowModeContext.jsx';

// This component is only the client-to-LUCID audience. Provider and inspector
// conversations must use separate tables and policies when those flows ship.
const ManagedCaseConversation = ({ caseId, status, staffView = false, onStatusChange }) => {
  const { showNotification } = useNotification();
  const { mode, role, userId } = useWorkflowActor();
  const workflowServices = useWorkflowServices();
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [requestMoreInfo, setRequestMoreInfo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadMessages() {
      try {
        if (mode === 'preview') {
          const audience = staffView ? 'client-admin' : 'client-admin';
          const result = await workflowServices.messages.listMessages(`${audience}:${caseId}`, { role, userId });
          if (result.error) throw result.error;
          if (active) {
            setMessages((result.data || []).map(message => ({
              id: message.id,
              sender_type: message.senderRole === 'client' ? 'client' : 'lucid',
              body: message.body,
              created_at: message.at,
            })));
            setLoadError(false);
          }
          return;
        }
        const { data, error } = await supabase
          .from('managed_case_messages')
          .select('id, sender_type, body, created_at')
          .eq('case_id', caseId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        if (active) {
          setMessages(data || []);
          setLoadError(false);
        }
      } catch (error) {
        console.error('Unable to load the LUCID case conversation:', error);
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMessages();
    return () => { active = false; };
  }, [caseId, refreshKey, mode, staffView, workflowServices, role, userId]);

  const handleSubmit = async event => {
    event.preventDefault();
    const message = body.trim();
    if (!message) return;

    setSending(true);
    try {
      if (mode === 'preview') {
        const result = await workflowServices.messages.sendMessage(`client-admin:${caseId}`, { role, userId, body: message });
        if (result.error) throw result.error;
        if (staffView && requestMoreInfo) {
          const statusResult = await workflowServices.cases.apply(caseId, { role, userId, action: 'request_information', payload: { message } });
          if (statusResult.error) throw statusResult.error;
          onStatusChange?.(caseId, statusResult.data.status);
        } else if (!staffView && status === 'needs_information') {
          const statusResult = await workflowServices.cases.apply(caseId, { role, userId, action: 'provide_information', payload: { message } });
          if (statusResult.error) throw statusResult.error;
          onStatusChange?.(caseId, statusResult.data.status);
        }
        setBody('');
        setRequestMoreInfo(false);
        setRefreshKey(value => value + 1);
        showNotification('Preview message saved in this browser.', 'success');
        return;
      }
      const { error } = await supabase.rpc('send_lucid_case_message', {
        p_case_id: caseId,
        p_body: message,
        p_request_more_info: staffView && requestMoreInfo,
      });
      if (error) throw error;

      setBody('');
      setRequestMoreInfo(false);
      // A client reply returns a request to staff review. A staff message can
      // explicitly place a not-yet-assigned request in the needs-info state.
      if (!staffView && status === 'needs_information') onStatusChange?.(caseId, 'submitted');
      if (staffView && requestMoreInfo) onStatusChange?.(caseId, 'needs_information');
      setRefreshKey(value => value + 1);
      showNotification(requestMoreInfo ? 'LUCID requested more information.' : 'Message sent to LUCID.', 'success');
    } catch (error) {
      console.error('Unable to send the LUCID case message:', error);
      showNotification(error.message || 'Your message could not be sent.', 'error');
    } finally {
      setSending(false);
    }
  };

  const canRequestMoreInfo = staffView && ['submitted', 'needs_information'].includes(status);

  return (
    <section className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-[#2d3748] dark:bg-[#252b3b]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-slate-100">Conversation with LUCID</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Only the client and authorized LUCID staff can read these messages.</p>
        </div>
        <button type="button" onClick={() => setRefreshKey(value => value + 1)} className="text-sm font-semibold text-primary hover:underline">Refresh</button>
      </div>

      <div className="mt-4 max-h-72 space-y-3 overflow-y-auto" aria-live="polite">
        {loading ? (
          <p role="status" className="text-sm text-gray-500 dark:text-slate-400">Loading conversation...</p>
        ) : loadError ? (
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">Messages could not be loaded. Use Refresh to try again.</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">No messages yet. Send a message to LUCID if you have a question or need to add details.</p>
        ) : messages.map(message => (
          <article key={message.id} className="rounded-lg bg-white p-3 dark:bg-[#1a1f2e]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-primary">{message.sender_type === 'client' ? 'Client' : 'LUCID team'}</p>
              <time className="text-xs text-gray-500 dark:text-slate-400" dateTime={message.created_at}>{new Date(message.created_at).toLocaleString()}</time>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700 dark:text-slate-300">{message.body}</p>
          </article>
        ))}
      </div>

      {!['completed', 'cancelled', 'resolved'].includes(status) && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 border-t border-gray-200 pt-4 dark:border-[#384255]">
          <label className="sr-only" htmlFor={`case-message-${caseId}`}>Message LUCID about this request</label>
          <textarea
            id={`case-message-${caseId}`}
            value={body}
            onChange={event => setBody(event.target.value)}
            maxLength={4000}
            rows={3}
            required
            placeholder="Write a message to LUCID..."
            className="w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-primary dark:border-[#384255] dark:bg-[#1a1f2e] dark:text-slate-200"
          />
          {canRequestMoreInfo && (
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
              <input type="checkbox" checked={requestMoreInfo} onChange={event => setRequestMoreInfo(event.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary" />
              Request more information; pause inspector assignment until the client replies
            </label>
          )}
          <div className="flex justify-end">
            <button type="submit" disabled={sending || !body.trim()} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50">
              <Send className="h-4 w-4" aria-hidden="true" />
              {sending ? 'Sending...' : requestMoreInfo ? 'Send request' : 'Send to LUCID'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
};

export default ManagedCaseConversation;
