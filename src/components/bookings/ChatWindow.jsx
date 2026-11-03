// src/components/chat/ChatWindow.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabaseClient.js';
import { Avatar } from '../ui/Avatar.jsx';
import { Send, ArrowLeft, Loader2, Paperclip, X } from 'lucide-react';
import {
  getConversationMessages,
  sendMessage,
  markConversationRead,
} from '../../services/bookings/chatService.js';

const ChatWindow = ({ conversation, currentUserId, onBack, onMessageSent, workflowServices, workflowRole, onReturnToCase }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const attachmentInputRef = useRef(null);

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
        const data = (result.data || []).map(item => ({ id: item.id, sender_id: item.senderRole === (workflowRole === 'service_provider' ? 'provider' : workflowRole) ? currentUserId : 'workflow-counterpart', message: item.body, attachment: item.attachment, created_at: item.at, is_read: item.read }));
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
    if (conversation.preview) return undefined;
    const caseId = conversation.caseId || conversation.id;
    const channel = supabase.channel(`managed-thread:${caseId}:${currentUserId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'managed_case_messages', filter: `case_id=eq.${caseId}` }, async () => {
      const result = await workflowServices.messages.listMessages(caseId, { role: workflowRole, userId: currentUserId });
      if (!result.error) setMessages((result.data || []).map(item => ({ id: item.id, sender_id: item.senderRole === (workflowRole === 'service_provider' ? 'provider' : workflowRole) ? currentUserId : 'workflow-counterpart', message: item.body, created_at: item.at, is_read: item.read })));
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
}, [conversation.id, conversation.caseId, conversation.preview, currentUserId, conversation.workflowThread, workflowServices, workflowRole]);
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
      let msg;
      if (conversation.workflowThread) {
        const result = await workflowServices.messages.sendMessage(conversation.id, { role: workflowRole, userId: currentUserId, body: text, attachment: selectedAttachment ? { name: selectedAttachment.name, type: selectedAttachment.type, size: selectedAttachment.size } : null });
        if (result.error) throw result.error;
        const refreshed = await workflowServices.messages.listMessages(conversation.id, { role: workflowRole, userId: currentUserId });
        if (refreshed.error) throw refreshed.error;
        const items = (refreshed.data || []).map(item => ({ id: item.id, sender_id: item.senderRole === (workflowRole === 'service_provider' ? 'provider' : workflowRole) ? currentUserId : 'workflow-counterpart', message: item.body, attachment: item.attachment, created_at: item.at, is_read: item.read }));
        setMessages(items);
        setSelectedAttachment(null);
        if (attachmentInputRef.current) attachmentInputRef.current.value = '';
        onMessageSent?.();
        return;
      }
      msg = await sendMessage({ conversationId: conversation.id, senderId: currentUserId, receiverId: otherUserId, message: text });

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
    setSelectedAttachment(file);
  };

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
    <div className="flex flex-col h-full bg-white dark:bg-[#1a1f2e]">
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
          {conversation.preview && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">Preview</span>}
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
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-gray-50 dark:bg-[#0f1117]">
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
                  {m.message && <p className="text-sm whitespace-pre-wrap break-words">{m.message}</p>}
                  {m.attachment && <div className={`mt-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs ${isMine ? 'bg-blue-500/60 text-white' : 'bg-gray-50 text-gray-700 dark:bg-[#1a1f2e] dark:text-slate-200'}`}><Paperclip className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span className="min-w-0 truncate">{m.attachment.name}</span><span className="shrink-0 opacity-80">{Math.max(1, Math.round(m.attachment.size / 1024))} KB</span></div>}
                  <p
                    className={`text-[10px] mt-1 ${
                      isMine ? 'text-blue-100' : 'text-gray-400 dark:text-slate-500'
                    } text-right`}
                  >
                    {formatTime(m.created_at)}
                    {isMine && m.is_read && ' ✓✓'}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {archived ? <p className="border-t border-gray-200 bg-gray-50 px-4 py-4 text-center text-sm text-gray-600 dark:border-[#1e293b] dark:bg-[#0f1117] dark:text-slate-400">This conversation is archived and read-only.</p> : <form
        onSubmit={handleSend}
        className="relative flex items-center gap-2 px-4 py-3 border-t border-gray-200 dark:border-[#1e293b] bg-white dark:bg-[#1a1f2e]"
      >
        {sendError && <p role="alert" className="absolute bottom-[4.5rem] left-4 right-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 shadow dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">{sendError}</p>}
        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 bg-gray-100 dark:bg-[#252b3b] rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={sending}
        />
        <input ref={attachmentInputRef} type="file" className="sr-only" aria-label="Attach a file" onChange={handleAttachmentChange} />
        <button type="button" onClick={() => attachmentInputRef.current?.click()} disabled={sending} className="rounded-full p-2.5 text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-[#252b3b]" aria-label="Attach a file"><Paperclip className="h-5 w-5" /></button>
        {selectedAttachment && <div className="absolute bottom-[4.5rem] left-4 flex max-w-[calc(100%-2rem)] items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow dark:border-[#394458] dark:bg-[#1a1f2e] dark:text-slate-200"><Paperclip className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{selectedAttachment.name}</span><span className="shrink-0 text-gray-500">{Math.max(1, Math.round(selectedAttachment.size / 1024))} KB</span><button type="button" onClick={() => { setSelectedAttachment(null); if (attachmentInputRef.current) attachmentInputRef.current.value = ''; }} aria-label="Remove attachment"><X className="h-4 w-4" /></button></div>}
        <button
          type="submit"
          disabled={(!newMessage.trim() && !selectedAttachment) || sending}
          className="p-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Send message"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>}
      {!archived && conversation.preview && <p className="border-t border-gray-100 bg-white px-4 pb-2 text-[10px] text-gray-500 dark:border-[#1e293b] dark:bg-[#1a1f2e] dark:text-slate-500">Attachments in Preview save file name and size only; file contents are not uploaded.</p>}
    </div>
  );
};

export default ChatWindow;
