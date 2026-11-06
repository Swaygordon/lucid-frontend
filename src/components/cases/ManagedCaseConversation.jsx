import React, { useCallback, useEffect, useState } from 'react';
import { CornerUpLeft, Pencil, Send, X } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import { useWorkflowActor, useWorkflowServices } from '../../contexts/WorkflowModeContext.jsx';

// All messages use the authenticated workflow service. The server enforces participants and edit history.
export default function ManagedCaseConversation({ caseId, status, staffView = false, onStatusChange }) {
  const { showNotification } = useNotification(); const actor = useWorkflowActor(); const services = useWorkflowServices();
  const [messages, setMessages] = useState([]); const [body, setBody] = useState(''); const [replyTo, setReplyTo] = useState(null); const [editing, setEditing] = useState(null);
  const [requestMoreInfo, setRequestMoreInfo] = useState(false); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [refreshKey, setRefreshKey] = useState(0);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await services.messages.listMessages(caseId, { role: actor.role, userId: actor.userId });
      if (result.error) throw result.error;
      setMessages((result.data || []).map(item => ({ ...item, sender_type: item.sender_type || (item.senderRole === 'client' ? 'client' : 'lucid'), created_at: item.created_at || item.at })));
    } catch (cause) { setError(cause.message || 'Messages could not be loaded.'); }
    finally { setLoading(false); }
  }, [services, caseId, actor.role, actor.userId]);
  useEffect(() => { load(); }, [load, refreshKey]);

  const submit = async event => {
    event.preventDefault(); if (!body.trim()) return;
    setBusy(true); setError('');
    try {
      const result = editing
        ? await services.messages.editMessage(editing.id, { role: actor.role, userId: actor.userId, body: body.trim() })
        : await services.messages.sendMessage(caseId, { role: actor.role, userId: actor.userId, body: body.trim(), requestMoreInfo: staffView && requestMoreInfo, replyToId: replyTo?.id || null });
      if (result.error) throw result.error;
      if (!editing && staffView && requestMoreInfo) onStatusChange?.(caseId, 'needs_information');
      if (!editing && !staffView && status === 'needs_information') onStatusChange?.(caseId, 'submitted');
      setBody(''); setReplyTo(null); setEditing(null); setRequestMoreInfo(false); setRefreshKey(value => value + 1);
      showNotification(editing ? 'Message updated.' : requestMoreInfo ? 'LUCID requested more information.' : 'Message sent.', 'success');
    } catch (cause) { setError(cause.message || 'The message could not be sent.'); }
    finally { setBusy(false); }
  };

  return <section className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-[#2d3748] dark:bg-[#252b3b]"><div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold text-gray-900 dark:text-slate-100">Conversation with LUCID</h3><p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Only the Client and authorized LUCID staff can read these messages.</p></div><button type="button" onClick={() => setRefreshKey(value => value + 1)} className="text-sm font-semibold text-primary hover:underline">Refresh</button></div>
    <div className="mt-4 max-h-72 space-y-3 overflow-y-auto" aria-live="polite">{loading ? <p role="status" className="text-sm text-gray-500">Loading conversation…</p> : error ? <p role="alert" className="text-sm text-red-700">{error}</p> : !messages.length ? <p className="text-sm text-gray-500">No messages yet. Send a message to LUCID if you have a question or need to add details.</p> : messages.map(message => <article key={message.id} className="rounded-lg bg-white p-3 dark:bg-[#1a1f2e]"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold text-primary">{message.sender_type === 'client' ? 'Client' : 'LUCID team'}</p>{message.created_at && <time className="text-xs text-gray-500" dateTime={message.created_at}>{new Date(message.created_at).toLocaleString()}</time>}</div>{message.replyTo && <blockquote className="mt-2 border-l-2 border-blue-300 pl-3 text-xs text-gray-500">Replying to {message.replyTo.senderRole === 'client' ? 'Client' : 'LUCID'}: {message.replyTo.excerpt}</blockquote>}<p className="mt-2 whitespace-pre-wrap text-sm text-gray-700 dark:text-slate-300">{message.body}</p>{message.editedAt && <details className="mt-2 text-xs text-gray-500"><summary className="cursor-pointer">Edited · view history</summary><ol className="mt-2 space-y-1">{(message.editHistory || []).map((edit,index)=><li key={`${message.id}-${index}`}>{new Date(edit.editedAt).toLocaleString()} · {edit.body}</li>)}</ol></details>}<div className="mt-3 flex flex-wrap gap-3"><button type="button" onClick={()=>{setReplyTo(message);setEditing(null);}} className="inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-primary"><CornerUpLeft size={14}/>Reply with quote</button>{message.senderRole === actor.role && message.created_at && Date.now()-new Date(message.created_at).getTime()<=120000 && <button type="button" onClick={()=>{setEditing(message);setReplyTo(null);setBody(message.body);}} className="inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-primary"><Pencil size={14}/>Edit (2 min)</button>}</div></article>)}</div>
    {!['completed','cancelled','resolved'].includes(status) && <form onSubmit={submit} className="mt-4 space-y-3 border-t border-gray-200 pt-4 dark:border-[#384255]">{(replyTo||editing)&&<div className="flex items-start justify-between gap-3 rounded-lg border-l-2 border-blue-400 bg-blue-50 p-3 text-xs text-blue-950"><div><p className="font-semibold">{editing?'Editing your message':`Replying to ${replyTo.sender_type==='client'?'Client':'LUCID'}`}</p><p className="mt-1 line-clamp-2">{editing?'The original message remains in the edit history.':replyTo.body}</p></div><button type="button" aria-label="Cancel reply or edit" onClick={()=>{setReplyTo(null);setEditing(null);setBody('');}} className="inline-flex h-8 w-8 items-center justify-center rounded-lg"><X size={16}/></button></div>}<label className="sr-only" htmlFor={`case-message-${caseId}`}>Message LUCID about this request</label><textarea id={`case-message-${caseId}`} value={body} onChange={event=>setBody(event.target.value)} maxLength={4000} rows={3} required placeholder="Write a message to LUCID…" className="w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-sm dark:border-[#384255] dark:bg-[#1a1f2e]"/>{staffView&&['submitted','needs_information'].includes(status)&&<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={requestMoreInfo} onChange={event=>setRequestMoreInfo(event.target.checked)}/>Request more information and pause assignment until the Client replies</label>}{error&&<p role="alert" className="text-sm text-red-700">{error}</p>}<div className="flex justify-end"><button type="submit" disabled={busy||!body.trim()} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-semibold text-white disabled:opacity-50"><Send size={16}/>{busy?'Sending…':editing?'Save edit':requestMoreInfo?'Send request':'Send to LUCID'}</button></div></form>}
  </section>;
}
