// src/components/chat/ChatWindow.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Avatar } from '../ui/Avatar';
import { Send, ArrowLeft, Loader2 } from 'lucide-react';
import {
  getConversationMessages,
  sendMessage,
  markConversationRead,
} from '../../lib/chatService';

const ChatWindow = ({ conversation, currentUserId, onBack, onMessageSent }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const otherUser = conversation.otherUser;
  const otherUserId = conversation.client_id === currentUserId
    ? conversation.provider_id
    : conversation.client_id;

  // Load messages
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      const data = await getConversationMessages(conversation.id);
      if (isMounted) {
        setMessages(data);
        setLoading(false);
      }
    };
    load();

    // Mark as read
    markConversationRead(conversation.id, currentUserId);

    return () => { isMounted = false; };
  }, [conversation.id, currentUserId]);

  // Real-time subscription to new messages in this conversation
 // Real-time subscription to new messages in this conversation
useEffect(() => {
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
}, [conversation.id, currentUserId]);
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const text = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const msg = await sendMessage({
        conversationId: conversation.id,
        senderId: currentUserId,
        receiverId: otherUserId,
        message: text,
      });

      // Optimistically add
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });

      onMessageSent?.();
    } catch (err) {
      console.error('Send failed:', err);
      setNewMessage(text); // Restore on failure
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
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
        </div>
      </div>

      {/* Booking context banner */}
      {conversation.booking && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-900/30">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <span className="font-semibold">Booking:</span> {conversation.booking.service_type || 'Service'} · {conversation.booking.service_date}
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-gray-50 dark:bg-[#0f1117]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
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
                  <p className="text-sm whitespace-pre-wrap break-words">{m.message}</p>
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
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 dark:border-[#1e293b] bg-white dark:bg-[#1a1f2e]"
      >
        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 bg-gray-100 dark:bg-[#252b3b] rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="p-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Send message"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;