// src/components/chat/ChatWindow.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabaseClient.js';
import { Avatar } from '../ui/Avatar.jsx';
import { Send, ArrowLeft, Loader2, Paperclip, X, Mic, Square, Reply, Pencil, Trash2 } from 'lucide-react';
import VoiceNotePlayer, { RecordingWaveform } from './VoiceNotePlayer.jsx';
import { formatVoiceTime } from './voiceNoteUtils.js';
import {
  getConversationMessages,
  sendMessage,
  markConversationRead,
} from '../../services/bookings/chatService.js';

const MAX_VOICE_NOTE_BYTES = 1024 * 1024;
const MAX_VOICE_NOTE_SECONDS = 60;
const messageForChat = (item, workflowRole, currentUserId) => ({
  id: item.id,
  sender_id: item.senderRole === (workflowRole === 'service_provider' ? 'provider' : workflowRole) ? currentUserId : 'workflow-counterpart',
  senderRole: item.senderRole,
  message: item.body,
  attachment: item.attachment,
  created_at: item.at,
  is_read: item.read,
  replyTo: item.replyTo || null,
  editedAt: item.editedAt || null,
  editHistory: item.editHistory || [],
});
const blobToDataUrl = blob => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(new Error('Voice note could not be prepared.'));
  reader.readAsDataURL(blob);
});

const ChatWindow = ({ conversation, currentUserId, onBack, onMessageSent, workflowServices, workflowRole, onReturnToCase }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [voiceDataUrl, setVoiceDataUrl] = useState('');
  const [voiceObjectUrl, setVoiceObjectUrl] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [replyTarget, setReplyTarget] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState('');
  const [now, setNow] = useState(Date.now());
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingStartedAtRef = useRef(0);
  const recordingTimerRef = useRef(null);
  const discardRecordingRef = useRef(false);

  const otherUser = conversation.otherUser;
  const otherUserId = conversation.client_id === currentUserId
    ? conversation.provider_id
    : conversation.client_id;

  // Load messages
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setLoadError('');
      if (conversation.workflowThread) {
        const result = await workflowServices.messages.listMessages(conversation.id, { role: workflowRole, userId: currentUserId });
        if (result.error) throw result.error;
        const data = (result.data || []).map(item => messageForChat(item, workflowRole, currentUserId));
        if (isMounted) { setMessages(data); setLoading(false); }
        return;
      }
      const data = await getConversationMessages(conversation.id);
      if (isMounted) { setMessages(data); setLoading(false); setLoadError(''); }
    };
    load().catch(error => { console.error('Unable to load conversation messages:', error); if (isMounted) { setLoadError(error.message || 'Messages could not be loaded.'); setLoading(false); } });

    // Mark as read for legacy marketplace conversations only.
    if (!conversation.workflowThread) markConversationRead(conversation.id, currentUserId);

    return () => { isMounted = false; };
  }, [conversation.id, currentUserId, conversation.workflowThread, workflowServices, workflowRole]);

  // Real-time subscription to new messages in this conversation
 // Real-time subscription to new messages in this conversation
useEffect(() => {
  if (conversation.workflowThread) {
    const caseId = conversation.caseId || conversation.id;
    const channel = supabase.channel(`managed-thread:${caseId}:${currentUserId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'managed_case_messages', filter: `case_id=eq.${caseId}` }, async () => {
      const result = await workflowServices.messages.listMessages(caseId, { role: workflowRole, userId: currentUserId });
      if (!result.error) setMessages((result.data || []).map(item => messageForChat(item, workflowRole, currentUserId)));
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }
  const channel = supabase
    .channel(`conversation:${conversation.id}:${Date.now()}`) // unique name
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversation.id}`,
      },
      (payload) => {
        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
        if (payload.new.receiver_id === currentUserId) {
          markConversationRead(conversation.id, currentUserId);
        }
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [conversation.id, conversation.caseId, currentUserId, conversation.workflowThread, workflowServices, workflowRole]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => () => {
    if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
    recordingStreamRef.current?.getTracks().forEach(track => track.stop());
    if (voiceObjectUrl) URL.revokeObjectURL(voiceObjectUrl);
  }, [voiceObjectUrl]);
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedAttachment) || sending) return;

    const text = newMessage.trim();
    setSendError('');
    setNewMessage('');
    setSending(true);

    try {
      if (conversation.workflowThread) {
        const result = editingMessageId
          ? await workflowServices.messages.editMessage(editingMessageId, { role: workflowRole, userId: currentUserId, body: text })
          : await workflowServices.messages.sendMessage(conversation.id, {
            role: workflowRole,
            userId: currentUserId,
            body: text,
            replyToId: replyTarget?.id || null,
            attachment: selectedAttachment ? { name: selectedAttachment.name, type: selectedAttachment.type, size: selectedAttachment.size, ...(voiceDataUrl ? { dataUrl: voiceDataUrl } : {}) } : null,
          });
        if (result.error) throw result.error;
        const refreshed = await workflowServices.messages.listMessages(conversation.id, { role: workflowRole, userId: currentUserId });
        if (refreshed.error) throw refreshed.error;
        const items = (refreshed.data || []).map(item => messageForChat(item, workflowRole, currentUserId));
        setMessages(items);
        setReplyTarget(null);
        setEditingMessageId('');
        setSelectedAttachment(null);
        setVoiceDataUrl('');
        if (voiceObjectUrl) URL.revokeObjectURL(voiceObjectUrl);
        setVoiceObjectUrl('');
        if (attachmentInputRef.current) attachmentInputRef.current.value = '';
        onMessageSent?.();
        return;
      }
      const msg = await sendMessage({ conversationId: conversation.id, senderId: currentUserId, receiverId: otherUserId, message: text });

      // Optimistically add
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });

      onMessageSent?.();
      setSelectedAttachment(null);
      if (attachmentInputRef.current) attachmentInputRef.current.value = '';
    } catch (err) {
      console.error('Send failed:', err);
      setNewMessage(text); // Restore on failure
      setSendError(err.message || 'Message could not be sent. Check your connection and try again.');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleAttachmentChange = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setSendError('Choose a file smaller than 10 MB.');
      event.target.value = '';
      return;
    }
    setSendError('');
    if (voiceObjectUrl) URL.revokeObjectURL(voiceObjectUrl);
    setVoiceObjectUrl('');
    setVoiceDataUrl('');
    setSelectedAttachment(file);
  };

  const handleStartRecording = async () => {
    setSendError('');
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setSendError('Voice recording is not available in this browser. You can attach an audio file instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (voiceObjectUrl) URL.revokeObjectURL(voiceObjectUrl);
      setVoiceObjectUrl('');
      setVoiceDataUrl('');
      setSelectedAttachment(null);
      if (attachmentInputRef.current) attachmentInputRef.current.value = '';
      recordingStreamRef.current = stream;
      recordingChunksRef.current = [];
      discardRecordingRef.current = false;
      const mimeType = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'].find(type => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 64000 } : { audioBitsPerSecond: 64000 });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = event => { if (event.data.size > 0) recordingChunksRef.current.push(event.data); };
      recorder.onerror = () => setSendError('The recording was interrupted. Please try again.');
      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        recordingStreamRef.current = null;
        setRecording(false);
        if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
        if (discardRecordingRef.current) { recordingChunksRef.current = []; return; }
        const blob = new Blob(recordingChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        recordingChunksRef.current = [];
        if (!blob.size) { setSendError('No audio was recorded. Check your microphone and try again.'); return; }
        if (blob.size > MAX_VOICE_NOTE_BYTES) { setSendError('This voice note is over 1 MB. Record a shorter note and try again.'); return; }
        try {
          const dataUrl = await blobToDataUrl(blob);
          if (voiceObjectUrl) URL.revokeObjectURL(voiceObjectUrl);
          setVoiceDataUrl(dataUrl);
          setVoiceObjectUrl(URL.createObjectURL(blob));
          setSelectedAttachment({ name: 'Voice note', type: blob.type || 'audio/webm', size: blob.size, isVoiceNote: true });
        } catch (error) { setSendError(error.message || 'Voice note could not be prepared.'); }
      };
      recorder.start();
      recordingStartedAtRef.current = Date.now();
      setRecordingSeconds(0);
      setRecording(true);
      recordingTimerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartedAtRef.current) / 1000);
        setRecordingSeconds(elapsed);
        if (elapsed >= MAX_VOICE_NOTE_SECONDS && mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
      }, 250);
    } catch {
      recordingStreamRef.current?.getTracks().forEach(track => track.stop());
      recordingStreamRef.current = null;
      setSendError('Allow microphone access in your browser to record a voice note.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
  };

  const handleCancelRecording = () => {
    discardRecordingRef.current = true;
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    setRecording(false);
    if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = null;
  };

  const handleReply = message => {
    setEditingMessageId('');
    setNewMessage('');
    setReplyTarget(message);
    inputRef.current?.focus();
  };

  const handleEdit = message => {
    setReplyTarget(null);
    setSelectedAttachment(null);
    setVoiceDataUrl('');
    if (voiceObjectUrl) URL.revokeObjectURL(voiceObjectUrl);
    setVoiceObjectUrl('');
    setEditingMessageId(message.id);
    setNewMessage(message.message || '');
    inputRef.current?.focus();
  };

  const cancelEdit = () => { setEditingMessageId(''); setNewMessage(''); };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (ts) => {
    const d = new Date(ts);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Group messages by date
  const grouped = [];
  const archived = conversation.archived || conversation.caseStatus === 'archived';
  let lastDate = null;
  messages.forEach(m => {
    const date = new Date(m.created_at).toDateString();
    if (date !== lastDate) {
      grouped.push({ type: 'date', label: formatDate(m.created_at), key: `date-${date}` });
      lastDate = date;
    }
    grouped.push({ type: 'message', data: m, key: m.id });
  });

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white dark:bg-[#1a1f2e]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-[#1e293b] bg-white dark:bg-[#1a1f2e]">
        {onBack && (
          <button
            onClick={onBack}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#252b3b]"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-slate-300" />
          </button>
        )}
        {otherUser?.avatar ? (
          <img src={otherUser.avatar} alt={otherUser.name} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <Avatar name={otherUser?.name || 'User'} size="md" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-slate-100 truncate">
            {otherUser?.name || 'User'}
          </p>
          {otherUser?.occupation && (
            <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
              {otherUser.occupation}
            </p>
          )}
          {conversation.workflowThread && <p className="truncate text-xs text-gray-500 dark:text-slate-400">{conversation.participantLabel}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onReturnToCase && <button type="button" onClick={onReturnToCase} className="rounded-lg border border-gray-200 px-2.5 py-2 text-[11px] font-semibold text-gray-700 hover:bg-gray-50 dark:border-[#394458] dark:text-slate-200 dark:hover:bg-[#252b3b] sm:px-3 sm:text-xs">Back to request</button>}
        </div>
      </div>

      {/* Booking context banner */}
      {conversation.booking && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-900/30">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <span className="font-semibold">Request:</span> {conversation.booking.service_type || 'Service'} · {conversation.caseId || conversation.booking.service_date} · {conversation.caseStatus ? String(conversation.caseStatus).replaceAll('_', ' ') : ''}
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-1 bg-gray-50 dark:bg-[#0f1117]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : loadError ? (
          <div role="alert" className="flex h-full items-center justify-center px-6 text-center text-sm text-red-700 dark:text-red-300">{loadError}</div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center px-4">
            <div>
              <p className="text-gray-500 dark:text-slate-400 mb-1">No messages yet</p>
              <p className="text-sm text-gray-400 dark:text-slate-500">
                Start the conversation with {otherUser?.name || 'this user'}
              </p>
            </div>
          </div>
        ) : (
          grouped.map(item => {
            if (item.type === 'date') {
              return (
                <div key={item.key} className="flex justify-center my-4">
                  <span className="text-xs text-gray-500 dark:text-slate-400 bg-white dark:bg-[#1a1f2e] px-3 py-1 rounded-full shadow-sm">
                    {item.label}
                  </span>
                </div>
              );
            }

            const m = item.data;
            const isMine = m.sender_id === currentUserId;

            return (
              <div
                key={item.key}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                    isMine
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white dark:bg-[#252b3b] text-gray-900 dark:text-slate-100 rounded-bl-sm shadow-sm'
                  }`}
                >
                  {m.replyTo && <div className={`mb-2 rounded-lg border-l-2 px-2.5 py-1.5 text-xs ${isMine ? 'border-blue-200 bg-blue-500/40 text-blue-50' : 'border-blue-500 bg-gray-50 text-gray-600 dark:bg-[#1a1f2e] dark:text-slate-300'}`}><p className="font-semibold">Reply to {String(m.replyTo.senderRole || 'message').replaceAll('_', ' ')}</p><p className="mt-0.5 line-clamp-2">{m.replyTo.excerpt || 'Attachment'}</p></div>}
                  {m.message && <p className="text-sm whitespace-pre-wrap break-words">{m.message}</p>}
                  {m.attachment?.dataUrl && m.attachment.type?.startsWith('audio/') ? <div className="mt-1"><VoiceNotePlayer src={m.attachment.dataUrl} outgoing={isMine}/></div> : m.attachment && <div className={`mt-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs ${isMine ? 'bg-blue-500/60 text-white' : 'bg-gray-50 text-gray-700 dark:bg-[#1a1f2e] dark:text-slate-200'}`}><Paperclip className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span className="min-w-0 truncate">{m.attachment.name}</span><span className="shrink-0 opacity-80">{Math.max(1, Math.round(m.attachment.size / 1024))} KB</span></div>}
                  <p
                    className={`text-[10px] mt-1 ${
                      isMine ? 'text-blue-100' : 'text-gray-400 dark:text-slate-500'
                    } text-right`}
                  >
                    {formatTime(m.created_at)}
                    {m.editedAt && <span className="ml-1">Edited</span>}
                  </p>
                  {m.editHistory?.length > 0 && <details className={`mt-1 text-[10px] ${isMine ? 'text-blue-100' : 'text-gray-500 dark:text-slate-400'}`}><summary className="cursor-pointer text-right">Previous versions</summary><ol className="mt-1 space-y-1 text-left">{m.editHistory.map((version, index) => <li key={`${m.id}-edit-${index}`} className="rounded bg-black/5 px-2 py-1"><span className="block">{version.body}</span><time dateTime={version.editedAt}>{formatTime(version.editedAt)}</time></li>)}</ol></details>}
                  {conversation.workflowThread && <div className={`mt-1 flex gap-3 text-[11px] ${isMine ? 'justify-end text-blue-100' : 'justify-start text-gray-500 dark:text-slate-400'}`}><button type="button" onClick={() => handleReply(m)} className="inline-flex items-center gap-1 rounded px-1 py-1 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"><Reply className="h-3 w-3" aria-hidden="true"/>Reply</button>{isMine && now - new Date(m.created_at).getTime() <= 2 * 60 * 1000 && <button type="button" onClick={() => handleEdit(m)} className="inline-flex items-center gap-1 rounded px-1 py-1 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"><Pencil className="h-3 w-3" aria-hidden="true"/>Edit</button>}</div>}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {archived ? <p className="border-t border-gray-200 bg-gray-50 px-4 py-4 text-center text-sm text-gray-600 dark:border-[#1e293b] dark:bg-[#0f1117] dark:text-slate-400">This conversation is archived and read-only.</p> : <form onSubmit={handleSend} className="relative space-y-2 border-t border-gray-200 bg-white px-3 py-3 dark:border-[#1e293b] dark:bg-[#1a1f2e] sm:px-4">
        {sendError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">{sendError}</p>}
        {replyTarget && <div className="flex items-start gap-2 rounded-lg border-l-2 border-blue-500 bg-blue-50 px-3 py-2 text-xs text-blue-950 dark:bg-blue-950/30 dark:text-blue-100"><div className="min-w-0 flex-1"><p className="font-semibold">Replying to {replyTarget.senderRole || (replyTarget.sender_id === currentUserId ? 'your message' : otherUser?.name || 'message')}</p><p className="mt-0.5 truncate">{replyTarget.message || replyTarget.attachment?.name || 'Voice note'}</p></div><button type="button" onClick={() => setReplyTarget(null)} aria-label="Cancel reply" className="rounded p-1 hover:bg-blue-100 dark:hover:bg-blue-900/50"><X size={15}/></button></div>}
        {editingMessageId && <div className="flex items-center justify-between gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"><span>Editing your message. You can edit it for two minutes after sending.</span><button type="button" onClick={cancelEdit} className="rounded px-2 py-1 font-semibold underline">Cancel edit</button></div>}
        <input ref={attachmentInputRef} type="file" className="sr-only" aria-label="Attach a file" onChange={handleAttachmentChange}/>
        {recording ? <div role="status" aria-label={`Recording voice note, ${formatVoiceTime(recordingSeconds)} of 1 minute`} className="flex min-h-14 items-center gap-3 rounded-full border border-rose-100 bg-rose-50 px-3 py-2 dark:border-rose-900/50 dark:bg-rose-950/30">
          <button type="button" onClick={handleCancelRecording} aria-label="Discard recording" title="Discard recording" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-600 transition hover:bg-white hover:text-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500 dark:text-slate-300 dark:hover:bg-rose-900/50"><Trash2 className="h-5 w-5"/></button>
          <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-rose-600" aria-hidden="true"/>
          <span className="min-w-[2.5rem] font-mono text-sm font-semibold tabular-nums text-gray-800 dark:text-slate-100">{formatVoiceTime(recordingSeconds)}</span>
          <RecordingWaveform/>
          <button type="button" onClick={handleStopRecording} aria-label="Finish recording" title="Finish recording" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"><Square size={16} fill="currentColor"/></button>
        </div> : <>
        {selectedAttachment && <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 dark:border-[#394458] dark:bg-[#252b3b] dark:text-slate-200">{selectedAttachment.isVoiceNote && voiceObjectUrl ? <><span className="font-semibold">Recording</span><VoiceNotePlayer src={voiceObjectUrl}/></> : <><Paperclip className="h-3.5 w-3.5 shrink-0" aria-hidden="true"/><span className="min-w-0 flex-1 truncate">{selectedAttachment.name}</span><span>{Math.max(1, Math.round(selectedAttachment.size / 1024))} KB</span></>}<button type="button" onClick={() => { setSelectedAttachment(null); setVoiceDataUrl(''); if (voiceObjectUrl) URL.revokeObjectURL(voiceObjectUrl); setVoiceObjectUrl(''); if (attachmentInputRef.current) attachmentInputRef.current.value = ''; }} aria-label="Remove attachment" className="rounded p-1 hover:bg-gray-200 dark:hover:bg-[#394458]"><X className="h-4 w-4"/></button></div>}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <input ref={inputRef} type="text" value={newMessage} onChange={event => setNewMessage(event.target.value)} placeholder={editingMessageId ? 'Edit your message...' : 'Type a message...'} className="min-w-0 flex-1 rounded-full bg-gray-100 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#252b3b] dark:text-slate-100" disabled={sending || recording}/>
          <button type="button" onClick={() => attachmentInputRef.current?.click()} disabled={sending || recording} className="rounded-full p-2.5 text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-[#252b3b]" aria-label="Attach a file"><Paperclip className="h-5 w-5"/></button>
          {!recording && conversation.workflowThread && <button type="button" onClick={handleStartRecording} disabled={sending || Boolean(editingMessageId)} className="rounded-full p-2.5 text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-[#252b3b]" aria-label="Record voice note" title="Record voice note"><Mic className="h-5 w-5"/></button>}
          {editingMessageId && <button type="button" onClick={cancelEdit} className="rounded-full p-2.5 text-gray-500 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-[#252b3b]" aria-label="Cancel edit"><X className="h-5 w-5"/></button>}
          <button type="submit" disabled={recording || ((!newMessage.trim() && !selectedAttachment) || (editingMessageId && !newMessage.trim())) || sending} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-blue-600 px-3 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50" aria-label={editingMessageId ? 'Save edited message' : 'Send message'}>{sending ? <Loader2 className="h-5 w-5 animate-spin"/> : editingMessageId ? <Pencil className="h-4 w-4"/> : <Send className="h-5 w-5"/>}<span className="sr-only">{editingMessageId ? 'Save edit' : 'Send'}</span></button>
        </div>
        </>}
      </form>}
    </div>
  );
};

export default ChatWindow;
