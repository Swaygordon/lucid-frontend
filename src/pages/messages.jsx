import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { PageHeader } from '../components/ui';
import ChatWindow from '../components/chat/ChatWindow';
import { Avatar } from '../components/ui/Avatar';
import { useNavigateBack } from '../hooks/useNavigateBack';
import {
  getUserConversations,
  subscribeToMessages,
} from '../lib/chatService';
import { MessageCircle } from 'lucide-react';
import { ChatSkeleton } from '../components/route_skeletons.jsx';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const Messages = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const handleBackClick = useNavigateBack('/lucid/dashboard', 600);

  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);

  const activeConversationId = searchParams.get('conversation');

  // Get current user & load conversations
  useEffect(() => {
    let unsubscribe;
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/lucid/signin');
          return;
        }
        setCurrentUser(user);

        const convs = await getUserConversations(user.id);
        setConversations(convs);

        // Auto-select conversation from URL
        if (activeConversationId) {
          const found = convs.find(c => c.id === activeConversationId);
          if (found) {
            setSelectedConversation(found);
            setShowChatOnMobile(true);
          }
        }

        // Subscribe to new incoming messages → refresh list
        unsubscribe = subscribeToMessages(user.id, async () => {
          const updated = await getUserConversations(user.id);
          setConversations(updated);
        });
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
    return () => { if (unsubscribe) unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Refresh conversations when a message is sent
  const refreshConversations = async () => {
    if (!currentUser) return;
    const updated = await getUserConversations(currentUser.id);
    setConversations(updated);
  };

  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
    setShowChatOnMobile(true);
    setSearchParams({ conversation: conv.id }, { replace: true });
  };

  const handleBackToList = () => {
    setShowChatOnMobile(false);
    setSelectedConversation(null);
    setSearchParams({}, { replace: true });
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (loading) return <ChatSkeleton />;

  return (
    <div
      className="h-screen bg-white dark:bg-[#1a1f2e] flex flex-col overflow-hidden"
      style={{ height: '100dvh' }}
    >
      <div className={showChatOnMobile ? 'hidden lg:block' : ''}>
        <PageHeader
          title="Messages"
          subtitle="Chat with your clients and service providers"
          onBack={handleBackClick}
        />
      </div>

      <div className="flex-1 min-h-0 w-full border-t border-gray-200 dark:border-[#1e293b]">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="h-full bg-white dark:bg-[#1a1f2e] overflow-hidden"
        >
          <div className="flex h-full">
            {/* Conversation list */}
            <div
              className={`w-full lg:w-80 xl:w-96 border-r border-gray-200 dark:border-[#1e293b] flex flex-col ${
                showChatOnMobile ? 'hidden lg:flex' : 'flex'
              }`}
            >
              <div className="px-4 py-3 border-b border-gray-200 dark:border-[#1e293b]">
                <h2 className="font-semibold text-gray-900 dark:text-slate-100">
                  Conversations
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center">
                    <MessageCircle className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-slate-400 text-sm">
                      No conversations yet
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                      Chat becomes available once a booking is accepted
                    </p>
                  </div>
                ) : (
                  conversations.map(conv => {
                    const isActive = selectedConversation?.id === conv.id;
                    const hasUnread = conv.unreadCount > 0;

                    return (
                      <button
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv)}
                        className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#252b3b] transition-colors text-left border-b border-gray-100 dark:border-[#1e293b]/50 ${
                          isActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        {conv.otherUser?.avatar ? (
                          <img
                            src={conv.otherUser.avatar}
                            alt={conv.otherUser.name}
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <Avatar name={conv.otherUser?.name || 'User'} size="lg" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`truncate ${hasUnread ? 'font-bold' : 'font-medium'} text-gray-900 dark:text-slate-100`}>
                              {conv.otherUser?.name || 'User'}
                            </p>
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {formatTimestamp(conv.lastMessage?.created_at || conv.last_message_at)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <p className={`text-sm truncate ${hasUnread ? 'text-gray-900 dark:text-slate-100 font-medium' : 'text-gray-500 dark:text-slate-400'}`}>
                              {conv.lastMessage?.message || 'No messages yet'}
                            </p>
                            {hasUnread && (
                              <span className="flex-shrink-0 bg-blue-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                                {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                              </span>
                            )}
                          </div>
                          {conv.booking && (
                            <p className="text-[11px] text-blue-600 dark:text-blue-400 truncate mt-1">
                              {conv.booking.service_type || 'Service'} · {conv.booking.service_date}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Chat window */}
            <div className={`flex-1 min-w-0 min-h-0 ${showChatOnMobile ? 'flex' : 'hidden lg:flex'} [&>*]:flex-1 [&>*]:min-w-0 [&>*]:min-h-0`}>
              {selectedConversation && currentUser ? (
                <ChatWindow
                  conversation={selectedConversation}
                  currentUserId={currentUser.id}
                  onBack={handleBackToList}
                  onMessageSent={refreshConversations}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-[#0f1117]">
                  <div className="text-center px-6">
                    <MessageCircle className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-700 dark:text-slate-300 mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400 max-w-xs mx-auto">
                      Choose a conversation from the list to start chatting
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Messages;