import React, { useState, useMemo, useRef, useEffect, memo, useCallback } from 'react';
import { ArrowLeft, Settings, Bell, CreditCard, MessageSquare, UserCheck, AlertCircle, CheckCircle, Trash2, Bookmark, Eye, EyeOff, ChevronDown, CalendarCheck, AlarmClock, Star, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useNavigateBack } from "../hooks/useNavigateBack.js";
import { useNotification } from '../contexts/NotificationContext';
import { supabase } from '../lib/supabaseClient';
import emptyNotificationsImage from '../assets/No Messages.webp';
import { NotificationBadge } from '../components/ui';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const slideIn = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

const MotionButton = motion.button;
const MotionDiv = motion.div;
const MotionImg = motion.img;

// Constants
const LONG_PRESS_DURATION = 600;

// Rough character-count heuristic for "is this message probably going to
// get truncated". Not exact (actual truncation depends on rendered pixel
// width, font, and card width), so it may occasionally show "Read more" on
// a message that would've fit anyway — harmless, since expanding it just
// shows the same text. Better a false positive here than hiding the control
// on a message that actually needed it.
const MESSAGE_EXPAND_THRESHOLD = 60;

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'read', label: 'Read' },
  { id: 'booking', label: 'Booking' },
  { id: 'payment', label: 'Payment' },
  { id: 'bookmark', label: 'Bookmark' },
  { id: 'other', label: 'Other' }
];

const NOTIFICATION_TYPES = {
  booking: {
    icon: CalendarCheck,
    getBg: () => 'bg-indigo-100',
    getColor: () => 'text-indigo-600'
  },
  payment: {
    icon: CreditCard,
    getBg: (status) => status === 'success' ? 'bg-green-100' : 'bg-red-100',
    getColor: (status) => status === 'success' ? 'text-green-600' : 'text-red-600'
  },
  message: {
    icon: MessageSquare,
    getBg: () => 'bg-blue-100',
    getColor: () => 'text-blue-600'
  },
  profile: {
    icon: UserCheck,
    getBg: () => 'bg-purple-100',
    getColor: () => 'text-purple-600'
  },
  verification: {
    icon: UserCheck,
    getBg: () => 'bg-cyan-100',
    getColor: () => 'text-cyan-600'
  },
  reminder: {
    icon: AlarmClock,
    getBg: () => 'bg-amber-100',
    getColor: () => 'text-amber-600'
  },
  review: {
    icon: Star,
    getBg: () => 'bg-yellow-100',
    getColor: () => 'text-yellow-600'
  },
  promotion: {
    icon: Megaphone,
    getBg: () => 'bg-pink-100',
    getColor: () => 'text-pink-600'
  },
  error: {
    icon: AlertCircle,
    getBg: () => 'bg-red-100',
    getColor: () => 'text-red-600'
  },
  default: {
    icon: Bell,
    getBg: () => 'bg-gray-100',
    getColor: () => 'text-gray-600'
  }
};

// ===========================================================================
// BACKEND ASSUMPTIONS — please review
// ===========================================================================
// This component reads/writes a Supabase table called `notifications`.
// Expected columns, and what happens if any are missing:
//
//   id            (uuid/int, PK)        required — used as React key + all
//                                       update/delete .eq('id', ...) calls
//   user_id       (uuid/int, FK->auth)  required — every query filters on
//                                       this; RLS should also scope SELECT/
//                                       UPDATE/DELETE to auth.uid() = user_id
//   type          (text)                required for icon/color selection.
//                                       Expected values: 'booking' | 'payment'
//                                       | 'message' | 'profile' | 'verification'
//                                       | 'reminder' | 'review' | 'promotion'
//                                       | 'error'. Anything else falls back
//                                       to a generic bell icon.
//                                       ALSO used by promoted filter tabs like
//                                       "Booking" and "Payment".
//   status        (text, nullable)      optional — only read for type
//                                       'payment' to color icon green/red.
//                                       Expected values: 'success' | 'error'.
//                                       If this column doesn't exist, payment
//                                       icons will always render red (since
//                                       status will be undefined !== 'success').
//   title         (text)                required — notification heading
//   message       (text)                required — notification body
//   is_read       (boolean)             required — drives the Unread/Read
//                                       filter tabs and the unread dot/badge.
//                                       Defaults to falsy (unread) if missing.
//   bookmarked    (boolean, nullable)   OPTIONAL / MAY NOT EXIST YET.
//                                       Powers the "Bookmark" filter tab and
//                                       the star/ring UI. If this column is
//                                       absent, handleBookmark's UPDATE call
//                                       will error (see try/catch there) —
//                                       the UI will just show an error toast
//                                       and bookmark state won't persist.
//                                       ACTION NEEDED: add a
//                                       `bookmarked boolean default false`
//                                       column, or tell me and I'll rip out
//                                       the bookmark feature.
//   link          (text, nullable)      OPTIONAL. Where clicking the
//                                       notification navigates. If absent,
//                                       resolveLink() below falls back to a
//                                       hardcoded path per `type` (see that
//                                       function) — so newly-added types
//                                       will just link to '#' until you
//                                       either add this column or extend the
//                                       fallback switch statement.
//   created_at    (timestamptz)         required — used for both the
//                                       relative "10 min / 2 hrs" label AND
//                                       the "Today / Yesterday / <date>"
//                                       section grouping. Must be a value
//                                       `new Date()` can parse (ISO 8601 —
//                                       Supabase's default timestamptz
//                                       serialization is fine).
//
// Row-Level Security: since every mutation below (delete, update is_read,
// update bookmarked, bulk mark-all-read, bulk clear-all) is issued directly
// from the client with the user's session, RLS policies on `notifications`
// MUST restrict all operations to rows where user_id = auth.uid(). Otherwise
// a user could theoretically target another user's notification id.
//
// Realtime: the subscription below listens to ALL rows on the table (not
// filtered server-side by user_id — Supabase Realtime free filtering is
// column-equality only and isn't applied here), then discards events for
// other users client-side via `payload.new.user_id !== userIdRef.current`.
// For DELETE events, `payload.old` typically only contains the primary key
// by default — if you need old.user_id to filter deletes server-side too,
// enable `REPLICA IDENTITY FULL` on the table in Postgres.
// ===========================================================================

// ---------------------------------------------------------------------------
// Data helpers — convert a raw `notifications` row from Supabase into the
// shape the UI expects (relative time, date grouping, resolved link, etc.)
// ---------------------------------------------------------------------------

const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min`;
  if (diffHr < 24) return `${diffHr} hr${diffHr > 1 ? 's' : ''}`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''}`;
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const formatDateGroup = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (target.getTime() === today.getTime()) return 'Today';
  if (target.getTime() === yesterday.getTime()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

// Where clicking a notification should navigate. Uses a `link` column if
// your table has one, otherwise falls back to a sensible default per type.
// ASSUMPTION: `/lucid/payments` was guessed — I don't know your actual
// payments route. If it's wrong, either fix it here or (better) start
// populating a `link` column when you insert notifications server-side so
// each notification carries its own precise destination.
const resolveLink = (row) => {
  if (row.link) return row.link;
  switch (row.type) {
    case 'booking': return '/lucid/bookings';
    case 'message': return '/lucid/messages';
    case 'profile': return '/lucid/account/profile';
    case 'verification': return '/lucid/account/profile';
    case 'payment': return '/lucid/payments';
    case 'reminder': return '/lucid/bookings';
    case 'review': return '/lucid/account/reviews';
    case 'promotion': return '/lucid/';
    default: return '#'; // unknown/new types land here — dead link
  }
};

// Maps a raw DB row -> the shape every component below expects.
// `!!row.bookmarked` means a missing/null column silently reads as `false`
// rather than throwing — bookmarking will just look like it "does nothing"
// until the column exists (see handleBookmark for the write-side failure).
const transformNotification = (row) => ({
  id: row.id,
  type: row.type || 'default',       // unknown/null type -> generic bell icon
  status: row.status || null,        // null -> payment icon defaults to red
  title: row.title,
  message: row.message,
  read: !!row.is_read,
  bookmarked: !!row.bookmarked,      // see BACKEND ASSUMPTIONS: optional column
  time: formatRelativeTime(row.created_at),
  date: formatDateGroup(row.created_at),
  loc: resolveLink(row),
  created_at: row.created_at
});

// Memoized Confirmation Modal Component
const ConfirmationModal = memo(({ isOpen, onClose, onConfirm, title, message, preview, confirmText, confirmColor = 'blue' }) => {
  if (!isOpen) return null;

  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    red: 'bg-red-600 hover:bg-red-700'
  };

  return (
    <AnimatePresence>
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <MotionDiv
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-[#1a1f2e] rounded-lg shadow-xl p-6 max-w-md mx-4"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className={`${confirmColor === 'red' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'} p-3 rounded-full`}>
              <Trash2 className={`w-6 h-6 ${confirmColor === 'red' ? 'text-red-600' : 'text-blue-600'}`} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">{title}</h2>
          </div>
          <p className="text-gray-600 dark:text-slate-400 mb-2">{message}</p>
          {preview && (
            <div className="bg-gray-50 dark:bg-[#252b3b] p-3 rounded-lg mb-6 border border-gray-200 dark:border-[#1e293b]">
              <p className="text-sm text-gray-700 dark:text-slate-300 font-semibold">{preview.title}</p>
              <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">{preview.message}</p>
            </div>
          )}
          <div className="flex space-x-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-[#252b3b] text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-300 dark:hover:bg-[#2d3448] transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium ${colorClasses[confirmColor]}`}
            >
              {confirmText}
            </button>
          </div>
        </MotionDiv>
      </MotionDiv>
    </AnimatePresence>
  );
});

// Memoized Actions Menu Component
const ActionsMenu = memo(({ notification, onMarkAsRead, onMarkAsUnread, onBookmark, onDelete, onClose }) => (
  <MotionDiv
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="absolute right-0 mt-2 bg-white dark:bg-[#1a1f2e] rounded-lg shadow-xl border border-gray-200 dark:border-[#1e293b] overflow-hidden z-20 min-w-48 notification-actions-menu"
  >
    {notification.read ? (
      <button
        onClick={() => onMarkAsUnread(notification.id)}
        className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-[#252b3b] text-blue-600 flex items-center space-x-3 text-sm"
      >
        <EyeOff className="w-4 h-4" />
        <span>Mark as Unread</span>
      </button>
    ) : (
      <button
        onClick={() => onMarkAsRead(notification.id)}
        className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-[#252b3b] text-blue-600 flex items-center space-x-3 text-sm"
      >
        <Eye className="w-4 h-4" />
        <span>Mark as Read</span>
      </button>
    )}

    <button
      onClick={() => onBookmark(notification.id)}
      className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-[#252b3b] text-orange-600 flex items-center space-x-3 text-sm"
    >
      <Bookmark className={`w-4 h-4 ${notification.bookmarked ? 'fill-orange-600' : ''}`} />
      <span>{notification.bookmarked ? 'Remove Bookmark' : 'Bookmark'}</span>
    </button>

    <button
      onClick={() => {
        onDelete(notification);
        onClose();
      }}
      className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center space-x-3 text-sm"
    >
      <Trash2 className="w-4 h-4" />
      <span>Delete</span>
    </button>
  </MotionDiv>
));

// Memoized Notification Item Component
const NotificationItem = memo(({ notification, onDelete, onShowActions }) => {
  const longPressTimer = useRef(null);
  // Whether the message is shown in full (wrapped) instead of truncated to
  // one line. Toggled only by the "Read more" button below, which now lives
  // outside the <Link> — see the Content section further down for why.
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const canExpand = (notification.message?.length || 0) > MESSAGE_EXPAND_THRESHOLD;


  const startLongPress = useCallback(() => {
    clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      onShowActions(notification.id);
    }, LONG_PRESS_DURATION);
  }, [notification.id, onShowActions]);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    onShowActions(notification.id);
  }, [notification.id, onShowActions]);

  const typeConfig = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.default;
  const Icon = typeConfig.icon;
  const iconBg = typeConfig.getBg(notification.status);
  const iconColor = typeConfig.getColor(notification.status);

  return (
    <MotionDiv
      variants={slideIn}
      onContextMenu={handleContextMenu}
      onMouseDown={startLongPress}
      onMouseUp={cancelLongPress}
      onMouseLeave={cancelLongPress}
      onTouchStart={startLongPress}
      onTouchEnd={cancelLongPress}
      className={`flex items-start gap-4 p-4 rounded-lg border transition-all duration-200 hover:shadow-md relative group cursor-pointer ${
        notification.read ? 'bg-white dark:bg-[#1a1f2e] border-gray-200 dark:border-[#1e293b]' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/40'
      } ${notification.bookmarked ? 'ring-2 ring-orange-400' : ''}`}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${iconBg} ${iconColor}`}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Content. The Link wraps only the title/header row — navigation is
          triggered by tapping the title, not the whole block. This keeps
          the "Read more" button below as a plain sibling <button>, never
          nested inside the <a> that react-router-dom's Link renders, which
          is invalid HTML (interactive element inside interactive element)
          even though most browsers "work" if you preventDefault around it. */}
      <div className="flex-1 min-w-0">
        <Link to={notification.loc} className="block">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-sm truncate min-w-0 flex-1">
              {notification.title}
            </h3>
            {/* Bookmark indicator + timestamp live in the same flex group so
                they can never collide with the delete button (or each other,
                or the title) — everything here claims real layout space
                instead of floating absolutely over other content. */}
            <div className="flex items-center gap-1.5 shrink-0">
              {notification.bookmarked && (
                <Bookmark className="w-3.5 h-3.5 text-orange-500 fill-orange-500" aria-label="Bookmarked" />
              )}
              <span className="text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">
                {notification.time}
              </span>
            </div>
          </div>
        </Link>

        <p
          title={notification.message}
          className={`text-sm text-gray-600 dark:text-slate-400 leading-relaxed ${
            expanded ? 'whitespace-normal break-words' : 'truncate'
          }`}
        >
          {notification.message}
        </p>
        {canExpand && (
          <button
            onClick={toggleExpanded}
            className="mt-0.5 flex items-center gap-0.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700"
          >
            {expanded ? 'Show less' : 'Read more'}
            <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Quick Delete Button — a real flex item (not absolutely positioned),
          so it reserves its own width and the title/date/message column
          shrinks to make room for it instead of running underneath it. This
          is what was causing the overlap at every breakpoint: the old
          version floated on top of the card with no layout space reserved,
          so a long date string could always collide with it regardless of
          screen size. Hidden below `sm` since touch devices use the
          long-press ActionsMenu instead (which has its own Delete option). */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification);
        }}
        aria-label="Delete notification"
        className="hidden sm:flex shrink-0 self-start p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
      </button>

      {/* Unread Indicator — far left, next to the icon column, nowhere near
          the bookmark/date/delete cluster on the right, so it never
          competes for the same space regardless of any of the above. */}
      {!notification.read && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full"></div>
      )}
    </MotionDiv>
  );
});

// Memoized Empty State Component
const EmptyState = memo(() => (
  <MotionDiv
    variants={fadeInUp}
    initial="hidden"
    animate="visible"
    className="flex flex-col items-center justify-center py-16 px-4"
  >
    <MotionImg
      src={emptyNotificationsImage}
      alt="No Notifications"
      className="w-44 h-44 object-cover mb-6"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2 }}
    />
    <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">No Notification Yet</h2>
    <p className="text-gray-600 dark:text-slate-400 text-center max-w-xs">
      You don't have any notification at the moment, check back later
    </p>
  </MotionDiv>
));

// Memoized Filter Button Component
const FilterButton = memo(({ filter, isActive, badgeCount, onClick }) => (
  <button
    onClick={onClick}
    className={`relative my-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
      isActive
        ? 'bg-blue-600 text-white shadow-md'
        : 'bg-white dark:bg-[#1a1f2e] text-gray-700 dark:text-slate-300 border border-gray-300 dark:border-[#2d3748] hover:border-blue-600'
    }`}
  >
    {filter.label}
    {badgeCount > 0 && !isActive && (
      <NotificationBadge count={badgeCount} />
    )}
  </button>
));

// Main Notifications Page
const NotificationsPage = () => {
  const navigate = useNavigate();
  const handleBackClick = useNavigateBack('/lucid/', 400);
  const { showNotification } = useNotification();

  const [selectedFilter, setSelectedFilter] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Keep the current user's id around for realtime filtering and bulk ops
  const userIdRef = useRef(null);

  // -------------------------------------------------------------------------
  // Fetch + realtime sync
  // -------------------------------------------------------------------------

  const fetchNotifications = useCallback(async () => {
    try {
      // ASSUMPTION: '/lucid/signin' is the correct sign-in route — confirm
      // this matches your actual router path.
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        navigate('/lucid/signin');
        return;
      }
      userIdRef.current = user.id;

      // NOTE: `select('*')` pulls every column. If the `notifications` table
      // grows columns not covered by transformNotification, they're fetched
      // but silently ignored — harmless, just extra payload. Consider
      // narrowing to `.select('id, user_id, type, status, title, message,
      // is_read, bookmarked, link, created_at')` once the schema is final,
      // so a column rename/removal fails loudly instead of just vanishing.
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications((data || []).map(transformNotification));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      showNotification('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  }, [navigate, showNotification]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    // IMPORTANT: this subscribes to postgres_changes on `notifications` with
    // NO server-side filter — every connected client receives every row's
    // events for ALL users, and we filter client-side below. This works but
    // is not private/efficient at scale. For a tighter setup, either:
    //   (a) add a server-side filter: `.on('postgres_changes',
    //       { event: 'INSERT', schema: 'public', table: 'notifications',
    //         filter: `user_id=eq.${userIdRef.current}` }, ...)` — note this
    //       requires userIdRef.current to be set BEFORE this effect runs,
    //       so you may need to move this subscription into fetchNotifications
    //       after the user id is known, or re-subscribe when it changes; or
    //   (b) confirm Realtime is enabled for this table in the Supabase
    //       dashboard (Database > Replication) — it's off by default.
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        if (payload.new.user_id !== userIdRef.current) return;
        setNotifications(prev => [transformNotification(payload.new), ...prev]);
        showNotification('New notification received!', 'info');
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications' }, (payload) => {
        if (payload.new.user_id !== userIdRef.current) return;
        setNotifications(prev => prev.map(n => n.id === payload.new.id ? transformNotification(payload.new) : n));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'notifications' }, (payload) => {
        // NOTE: no user_id check here — by default Postgres only sends the
        // primary key in payload.old for deletes, so we can't verify
        // ownership client-side. This is safe ONLY because it just removes
        // a matching id from local state (a no-op if that id isn't in this
        // user's list). If you enable REPLICA IDENTITY FULL on this table,
        // payload.old.user_id becomes available and you can add a check
        // here matching the INSERT/UPDATE handlers above.
        setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showNotification]);

  // Close actions menu on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (selectedNotification) {
        const openMenu = document.querySelector('.notification-actions-menu');
        if (openMenu && !openMenu.contains(e.target)) {
          setSelectedNotification(null);
        }
      }
    };

    document.addEventListener('click', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('click', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [selectedNotification]);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setSelectedNotification(null);
        setConfirmDelete(null);
        setConfirmClearAll(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Calculate badge counts (payment/bookmark buckets derived straight from
  // real columns — no separate mock "category" field needed anymore)
  const badgeCounts = useMemo(() => {
    const unreadCount = notifications.filter(n => !n.read).length;
    const hasUnread = unreadCount > 0;

    return {
      all: hasUnread ? notifications.length : 0,
      unread: unreadCount,
      read: hasUnread ? notifications.filter(n => n.read).length : 0,
      booking: hasUnread ? notifications.filter(n => n.type === 'booking' && !n.read).length : 0,
      payment: hasUnread ? notifications.filter(n => n.type === 'payment' && !n.read).length : 0,
      bookmark: hasUnread ? notifications.filter(n => n.bookmarked && !n.read).length : 0,
      // "Other" = anything that isn't a payment type and isn't bookmarked
      // (message, profile, error, or any custom/unrecognized type)
      other: hasUnread ? notifications.filter(n => !['booking', 'payment'].includes(n.type) && !n.bookmarked && !n.read).length : 0
    };
  }, [notifications]);

  // Filter and group notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    if (selectedFilter === 'unread') {
      filtered = notifications.filter(n => !n.read);
    } else if (selectedFilter === 'read') {
      filtered = notifications.filter(n => n.read);
    } else if (selectedFilter === 'booking') {
      filtered = notifications.filter(n => n.type === 'booking');
    } else if (selectedFilter === 'payment') {
      filtered = notifications.filter(n => n.type === 'payment');
    } else if (selectedFilter === 'bookmark') {
      filtered = notifications.filter(n => n.bookmarked);
    } else if (selectedFilter === 'other') {
      // Same "not payment, not bookmarked" rule as the badge count above,
      // but without the unread restriction — shows all such notifications
      // regardless of read state.
      filtered = notifications.filter(n => !['booking', 'payment'].includes(n.type) && !n.bookmarked);
    }

    return filtered.reduce((acc, notification) => {
      const date = notification.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(notification);
      return acc;
    }, {});
  }, [notifications, selectedFilter]);

  // -------------------------------------------------------------------------
  // Mutations — every one of these now hits Supabase first, then syncs
  // local state once the write succeeds.
  // -------------------------------------------------------------------------

  const handleDelete = useCallback(async (id) => {
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== id));
      showNotification('Notification deleted', 'success');
    } catch (error) {
      console.error('Error deleting notification:', error);
      showNotification('Failed to delete notification', 'error');
    }
  }, [showNotification]);

  const handleMarkAsRead = useCallback(async (id) => {
    try {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      if (error) throw error;
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setSelectedNotification(null);
      showNotification('Marked as read', 'success');
    } catch (error) {
      console.error('Error marking as read:', error);
      showNotification('Failed to mark as read', 'error');
    }
  }, [showNotification]);

  const handleMarkAsUnread = useCallback(async (id) => {
    try {
      const { error } = await supabase.from('notifications').update({ is_read: false }).eq('id', id);
      if (error) throw error;
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: false } : n));
      setSelectedNotification(null);
      showNotification('Marked as unread', 'info');
    } catch (error) {
      console.error('Error marking as unread:', error);
      showNotification('Failed to mark as unread', 'error');
    }
  }, [showNotification]);

  const handleBookmark = useCallback(async (id) => {
    const target = notifications.find(n => n.id === id);
    if (!target) return;
    const nextBookmarked = !target.bookmarked;

    try {
      // ASSUMPTION: requires a `bookmarked boolean` column on `notifications`.
      // If it doesn't exist yet, this `.update()` will return a Postgres
      // "column does not exist" error, we'll catch it below, show an error
      // toast, and local state won't change — so the star/ring will not
      // visually toggle on repeated taps. Add the column to fix, or ping me
      // to remove the bookmark feature if it's not planned.
      const { error } = await supabase.from('notifications').update({ bookmarked: nextBookmarked }).eq('id', id);
      if (error) throw error;
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, bookmarked: nextBookmarked } : n));
      setSelectedNotification(null);
      showNotification(nextBookmarked ? 'Added to bookmarks' : 'Removed from bookmarks', 'success');
    } catch (error) {
      console.error('Error updating bookmark:', error);
      showNotification('Failed to update bookmark', 'error');
    }
  }, [notifications, showNotification]);

  const handleMarkAllRead = useCallback(async () => {
    try {
      // Bulk update scoped to this user + currently-unread rows. This relies
      // on RLS to also enforce user_id = auth.uid() server-side — the
      // .eq('user_id', ...) here is a client-side convenience filter, not a
      // security boundary. Without RLS, a modified client could omit this
      // filter and update other users' rows.
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userIdRef.current)
        .eq('is_read', false);
      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      showNotification('All notifications marked as read', 'success');
    } catch (error) {
      console.error('Error marking all as read:', error);
      showNotification('Failed to mark all as read', 'error');
    }
  }, [showNotification]);

  const handleClearAll = useCallback(async () => {
    try {
      // Same RLS caveat as handleMarkAllRead above — this deletes every row
      // for the current user. Double-check RLS enforces user_id = auth.uid()
      // on DELETE too, not just SELECT, or this becomes exploitable.
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userIdRef.current);
      if (error) throw error;
      setNotifications([]);
      setConfirmClearAll(false);
      showNotification('All notifications cleared', 'success');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      showNotification('Failed to clear notifications', 'error');
    }
  }, [showNotification]);

  const hasNotifications = Object.keys(filteredNotifications).length > 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1117]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117]">
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          handleDelete(confirmDelete.id);
          setConfirmDelete(null);
        }}
        title="Delete Notification?"
        message="Are you sure you want to delete this notification?"
        preview={confirmDelete}
        confirmText="Delete"
        confirmColor="red"
      />

      {/* Clear All Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmClearAll}
        onClose={() => setConfirmClearAll(false)}
        onConfirm={handleClearAll}
        title="Clear All Notifications?"
        message="This will delete ALL notifications. This action cannot be undone."
        confirmText="Clear All"
        confirmColor="blue"
      />

      {/* Header */}
      <MotionDiv
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white dark:bg-[#1a1f2e] border-b border-gray-200 dark:border-[#1e293b] sticky top-0 z-10"
      >
        <div className="w-full mx-auto px-10 py-4">
          <div className="flex items-center justify-between mb-4">
            <MotionButton
              onClick={handleBackClick}
              aria-label="Go back"
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-full transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-slate-300" />
            </MotionButton>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Notifications</h1>
            <Link to='/lucid/notifications/settings' aria-label="Notification settings">
            <MotionButton
              aria-label="Notification settings"
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-full transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Settings className="w-6 h-6 text-gray-700 dark:text-slate-300" />
            </MotionButton>
            </Link>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {FILTERS.map(filter => (
              <FilterButton
                key={filter.id}
                filter={filter}
                isActive={selectedFilter === filter.id}
                badgeCount={badgeCounts[filter.id]}
                onClick={() => setSelectedFilter(filter.id)}
              />
            ))}
          </div>
        </div>
      </MotionDiv>

      {/* Content */}
      <div className="w-full mx-auto px-10 py-6">
        {hasNotifications ? (
          <>
            {/* Action Buttons */}
            {badgeCounts.unread > 0 && (
              <MotionDiv
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between items-center mb-4"
              >
                <button
                  onClick={handleMarkAllRead}
                  className="text-sm text-blue-700 dark:text-blue-400 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark all as read
                </button>
                <button
                  onClick={() => setConfirmClearAll(true)}
                  className="text-sm text-red-700 dark:text-red-400 hover:text-red-800 font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear all
                </button>
              </MotionDiv>
            )}

            {/* Notifications */}
            <AnimatePresence mode="popLayout">
              {Object.entries(filteredNotifications).map(([date, items]) => (
                <MotionDiv
                  key={date}
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  className="mb-6"
                >
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">{date}</h2>
                  <div className="space-y-3">
                    {items.map(notification => (
                      <div key={notification.id} className="relative">
                        <NotificationItem
                          notification={notification}
                          onDelete={setConfirmDelete}
                          onShowActions={setSelectedNotification}
                        />

                        {/* Actions Menu */}
                        <AnimatePresence>
                          {selectedNotification === notification.id && (
                            <ActionsMenu
                              notification={notification}
                              onMarkAsRead={handleMarkAsRead}
                              onMarkAsUnread={handleMarkAsUnread}
                              onBookmark={handleBookmark}
                              onDelete={setConfirmDelete}
                              onClose={() => setSelectedNotification(null)}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </MotionDiv>
              ))}
            </AnimatePresence>
          </>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
};

export default memo(NotificationsPage);
