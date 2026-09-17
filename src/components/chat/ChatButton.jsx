// src/components/chat/ChatButton.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { canChatForBooking } from '../../lib/chatService';
import { useNotification } from '../../contexts/NotificationContext';

/**
 * Renders a "Chat" button that opens the messages page for a booking.
 * Only enabled when the booking is accepted/in_progress/completed.
 */
const ChatButton = ({ booking, currentUserId, className = '', variant = 'primary' }) => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);

  // Only allow chat for accepted+ bookings
  const chatAllowed = ['accepted', 'in_progress', 'completed'].includes(booking.status);

  const handleClick = async (e) => {
    e?.stopPropagation();
    if (!chatAllowed) {
      showNotification('Chat becomes available once the booking is accepted', 'info');
      return;
    }

    setLoading(true);
    try {
      const result = await canChatForBooking(booking.id, currentUserId);
      if (!result.allowed) {
        showNotification(result.reason || 'Chat not available', 'info');
        return;
      }
      navigate(`/lucid/messages?conversation=${result.conversation.id}`);
    } catch (err) {
      console.error('Chat error:', err);
      showNotification('Failed to open chat', 'error');
    } finally {
      setLoading(false);
    }
  };

  const baseClasses = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors';
  const variantClasses = chatAllowed
    ? 'bg-blue-600 text-white hover:bg-blue-700'
    : 'bg-gray-200 dark:bg-[#252b3b] text-gray-400 dark:text-slate-500 cursor-not-allowed';

  return (
    <button
      onClick={handleClick}
      disabled={loading || !chatAllowed}
      className={`${baseClasses} ${variantClasses} ${className}`}
      title={chatAllowed ? 'Open chat' : 'Chat available after booking is accepted'}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
      Chat
    </button>
  );
};

export default ChatButton;