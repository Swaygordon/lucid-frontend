// @backend-handoff-delete Local Preview messaging implementation; replace data operations with backend messaging.
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageHeader } from '../../components/ui';
import { Avatar } from '../../components/ui/Avatar.jsx';
import ChatWindow from '../../components/bookings/ChatWindow.jsx';
import { useNavigateBack } from '../../hooks/useNavigateBack.js';
import { MessageCircle } from 'lucide-react';
import { ChatSkeleton } from '../../app/components/RouteSkeletons.jsx';
import { useWorkflowActor, useWorkflowServices } from '../../contexts/WorkflowModeContext.jsx';

const ROLE_LABELS = { admin: 'LUCID Admin / HR', client: 'Client', provider: 'Service Provider', inspector: 'Inspector' };
const normalizeRole = role => role === 'service_provider' ? 'provider' : role;
const mapConversation = (item, role) => {
  const currentRole = normalizeRole(role);
  const participants = item.audience.split('-');
  const otherRole = participants.find(value => value !== currentRole);
  return { ...item, otherUser: { name: ROLE_LABELS[otherRole] || 'LUCID team' }, participantLabel: participants.map(value => ROLE_LABELS[value] || value).join(' · '), lastMessage: { message: item.lastMessage, created_at: item.lastMessageAt }, booking: { service_type: item.serviceName, service_date: item.preview ? 'Preview case' : 'Managed request' }, preview: item.preview, workflowThread: true };
};
const caseStatusLabel = status => String(status || 'open').replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const Messages = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const handleBackClick = useNavigateBack('/lucid/dashboard', 600);
  const actor = useWorkflowActor();
  const workflowServices = useWorkflowServices();

  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const [inboxError, setInboxError] = useState('');

  const activeConversationId = searchParams.get('conversation');
  const returnTo = searchParams.get('returnTo');
  const safeReturnTo = returnTo && /^\/lucid\/cases\/[A-Za-z0-9-]+$/.test(returnTo) ? returnTo : null;

  // The original inbox layout now reads role-authorized workflow threads.
  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        if (!actor.userId) { navigate('/lucid/signin'); return; }
        const user = { id: actor.userId };
        setCurrentUser(user);
        const result = await workflowServices.messages.listConversations({ role: actor.role, userId: user.id });
        if (result.error) throw result.error;
        const convs = (result.data || []).map(item => mapConversation(item, actor.role));
        if (!active) return;
        setConversations(convs);
        if (activeConversationId) { const found = convs.find(item => item.id === activeConversationId); if (found) { setSelectedConversation(found); setShowChatOnMobile(true); } }
      } catch (err) {
        console.error('Failed to load workflow conversations:', err);
        if (active) setInboxError(err.message || 'Messages are not connected for this role yet.');
      } finally { if (active) setLoading(false); }
    };
    init();
    return () => { active = false; };
  }, [navigate, activeConversationId, actor.userId, actor.role, workflowServices]);

  const refreshConversations = useCallback(async () => {
    if (!currentUser) return;
    const result = await workflowServices.messages.listConversations({ role: actor.role, userId: currentUser.id });
    if (!result.error) setConversations((result.data || []).map(item => mapConversation(item, actor.role)));
  }, [currentUser, workflowServices, actor.role]);

  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
    setShowChatOnMobile(true);
    setSearchParams({ conversation: conv.id, ...(returnTo ? { returnTo } : {}) }, { replace: true });
  };

  const handleBackToList = () => {
    setShowChatOnMobile(false);
    setSelectedConversation(null);
    setSearchParams(returnTo ? { returnTo } : {}, { replace: true });
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
          subtitle="Case conversations with LUCID and assigned team members"
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
                {inboxError ? <div role="alert" className="p-6 text-sm text-gray-600 dark:text-slate-300">{inboxError}</div> : conversations.length === 0 ? (
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
                          <p className="mt-1 truncate text-[11px] text-blue-700 dark:text-blue-300">{conv.caseId || 'LUCID support'} · {caseStatusLabel(conv.caseStatus)}</p>
                          <p className="mt-1 truncate text-[11px] text-gray-500 dark:text-slate-400">{conv.participantLabel}</p>
                          {conv.preview && <span data-preview-disclosure className="mt-1 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">Preview</span>}
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
                <ChatWindow conversation={selectedConversation} currentUserId={currentUser.id} onBack={handleBackToList} onMessageSent={refreshConversations} workflowServices={workflowServices} workflowRole={actor.role} returnTo={safeReturnTo} onReturnToCase={safeReturnTo ? () => navigate(safeReturnTo) : null} />
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
