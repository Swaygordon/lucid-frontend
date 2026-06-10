import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useNavigateBack } from '../hooks/useNavigateBack.js';
import { useNotification } from '../contexts/NotificationContext';
import { Avatar, StatCard } from '../components/ui';
import EarningsDashboard from '../components/earningsDashboard.jsx';
import { BookingDetailsModal } from '../components/shared';
import EarningsChart from '../components/earnings_chart.jsx';
import { supabase } from '../lib/supabaseClient';
import {
  ArrowLeft, TrendingUp, Calendar, DollarSign, Star, Clock,
  CheckCircle, Award, Briefcase, MapPin, MessageSquare, Bell,
  ChevronRight, ChevronDown, Activity, Users, Eye, User
} from 'lucide-react';

const PERIODS = [
  { value: 'week',  label: 'This Week'  },
  { value: 'month', label: 'This Month' },
  { value: 'year',  label: 'This Year'  },
];

const PeriodDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected = PERIODS.find(p => p.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-2 rounded-lg bg-white dark:bg-[#1a1f2e] transition-all ${
          open ? 'border-primary text-primary' : 'border-gray-200 dark:border-[#2d3748] text-gray-700 dark:text-slate-300 hover:border-gray-300'
        }`}
      >
        {selected?.label}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-20 bg-white dark:bg-[#252b3b] border border-gray-100 dark:border-[#1e293b] rounded-xl shadow-xl overflow-hidden w-full">
          {PERIODS.map(period => (
            <button
              key={period.value}
              type="button"
              onClick={() => { onChange(period.value); setOpen(false); }}
              className={`w-full text-center px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-[#1e293b] ${
                value === period.value ? 'text-primary font-semibold bg-primary/5' : 'text-gray-700 dark:text-slate-300'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
};

const ActivityItem = ({ icon: Icon, title, description, time, status, to }) => {
  const statusColors = {
    completed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-error',
    new: 'bg-primary-50 text-primary'
  };

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ x: 5 }}
      className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-[#252b3b] rounded-lg transition-colors"
    >
      <Link to={to} className="flex gap-4 flex-1">
        <div className="w-9 h-9 p-2 bg-primary-50 dark:bg-primary/10 rounded-lg flex-shrink-0 self-start">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">{title}</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">{description}</p>
            </div>
            {status && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[status]}`}>
                {status}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 dark:text-slate-400 mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {time}
          </p>
        </div>
      </Link>
    </motion.div>
  );
};

const DashboardBookingCard = ({ booking, onViewDetails }) => {
  const clientName = booking.client?.name ?? 'Client';
  const locationLabel = [booking.location?.area, booking.location?.city]
    .filter(Boolean).join(', ');

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.02 }}
      className="bg-white dark:bg-[#1a1f2e] border-2 border-gray-100 dark:border-[#1e293b] rounded-xl p-5 hover:border-primary/30 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar name={clientName} size="md" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-slate-100">{clientName}</h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">{booking.title}</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-primary-50 dark:bg-primary/10 text-primary text-xs font-semibold rounded-full capitalize">
          {booking.status}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
          <Calendar className="w-4 h-4" />
          <span>{booking.date} at {booking.time}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
          <MapPin className="w-4 h-4" />
          <span>{locationLabel}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-[#1e293b]">
        <span className="text-lg font-bold text-gray-900 dark:text-slate-100">GH₵{booking.price}</span>
        <button
          onClick={() => onViewDetails(booking)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm font-semibold"
        >
          View Details
        </button>
      </div>
    </motion.div>
  );
};

const QuickAction = ({ icon: Icon, label, to, badgeCount }) => (
  <motion.div variants={itemVariants} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
    <Link
      to={to}
      className="flex flex-col items-center gap-3 p-6 bg-white dark:bg-[#1a1f2e] rounded-xl shadow-md hover:shadow-xl transition-shadow"
    >
      <div className="p-4 bg-gradient-to-br from-primary-light to-primary rounded-xl relative">
        <Icon className="w-6 h-6 text-white" />
        {badgeCount > 0 && (
          <span className="absolute -top-2 -right-2 min-w-5 h-5 bg-error rounded-full flex items-center justify-center text-xs text-white font-bold px-1 border-2 border-white">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </div>
      <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">{label}</span>
    </Link>
  </motion.div>
);

const ProviderDashboard = () => {
  const [currentUserName, setCurrentUserName] = useState('Provider');
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase.from('profiles').select('first_name, last_name').eq('id', session.user.id).single()
        .then(({ data }) => {
          if (data) {
            const name = [data.first_name, data.last_name].filter(Boolean).join(' ');
            if (name) setCurrentUserName(name);
          }
        });
    });
  }, []);

  const [timeframe, setTimeframe] = useState('week');
  const [selectedBooking, setSelectedBooking] = useState(null);
  // [API] GET /notifications/count?userId={id}&read=false → { count: number }
  // [WS] Subscribe to WebSocket 'notification' events on this provider's channel.
  const [notificationCount, setNotificationCount] = useState(5);
  // [API] GET /messages/unread-count?userId={id} → { count: number }
  const [unreadMessages] = useState(3);
  // [API] GET /bookings/new-count?providerId={id} — new booking requests not yet reviewed
  const [unreadBookings] = useState(5);

  const handleBackClick = useNavigateBack('/lucid/', 200);
  const { showNotification } = useNotification();

  const handleAccept = async (booking) => {
    // [API] POST /bookings/:id/quotes  { quotedPrice, breakdown, notes }  (opens QuotePriceModal first)
    // Or if no quoting step: PATCH /bookings/:id/status  { status: 'confirmed' }
    // Backend must notify client and start the job timer.
    showNotification('Booking accepted successfully!', 'success');
    setSelectedBooking(null);
  };

  const handleDecline = async (booking) => {
    // [API] PATCH /bookings/:id/status  { status: 'cancelled', reason: 'provider_declined' }
    // Backend must notify client and trigger any applicable refund.
    showNotification('Booking declined', 'info');
    setSelectedBooking(null);
  };

  const handleMarkComplete = async (booking) => {
    // [API] POST /bookings/:id/completion-request  { requestedBy: 'provider' }
    // Backend sets bookings.completionRequest.status = 'pending' and notifies client to confirm.
    // Client must confirm completion before payment is released.
    showNotification('Job marked as complete!', 'success');
    setSelectedBooking(null);
  };

  // [API] POST /bookings/:id/price-adjustment — {originalPrice, newPrice, reason} → {adjustmentId, status: 'pending'}
  const handleSubmitPriceAdjustment = (adjustmentData) => {
    setSelectedBooking(prev => prev ? {
      ...prev,
      priceAdjustment: {
        status: 'pending',
        originalPrice: adjustmentData.originalPrice,
        newPrice: adjustmentData.newPrice,
        reason: adjustmentData.reason,
        requestedBy: 'provider',
        timestamp: adjustmentData.timestamp,
      }
    } : null);
    showNotification('Price adjustment request sent to client.', 'success');
  };

  // [API] GET /bookings?providerId={authenticatedProviderId}&status=pending,confirmed,in-progress
  const allBookings = useMemo(() => [], []);
  const bookingStats = useMemo(() => ({
    total: 0, completed: 0, pending: 0, confirmed: 0, inProgress: 0, cancelled: 0,
    totalEarnings: 0, avgRating: 'N/A', active: 0, totalRevenue: 0, completionRate: 0,
  }), []);

  const activeBookings = useMemo(() =>
    allBookings.filter(b => ['pending', 'confirmed', 'in-progress'].includes(b.status)),
    [allBookings]
  );

  // [API] GET /providers/:id/stats?period={timeframe}
  // → { totalJobs, totalEarnings, avgRating, totalClients, weekOverWeekChange: {...} }
  // 'Clients: 34' and all change/trend values are hardcoded placeholders — replace with real stats.
  const stats = useMemo(() => [
    { icon: Briefcase, title: 'Total Jobs', value: bookingStats.total.toString(), change: '+12%', trend: 'up', color: 'blue' },
    { icon: DollarSign, title: 'Earnings', value: `GH₵${bookingStats.totalEarnings}`, change: '+8%', trend: 'up', color: 'green' },
    { icon: Star, title: 'Rating', value: bookingStats.avgRating, change: '+0.2', trend: 'up', color: 'orange' },
    // [DB] COUNT DISTINCT client_id from bookings WHERE provider_id = ? AND status = 'completed'
    { icon: Users, title: 'Clients', value: '34', change: '+5', trend: 'up', color: 'purple' }
  ], [bookingStats]);

  // [MOCK] Replace with: GET /activity-feed?userId={id}&limit=4
  // → [{ type: 'job_completed'|'new_message'|'new_review'|'booking_confirmed',
  //       title, description, timestamp, relatedId, relatedRoute, status }]
  const recentActivities = [
    { icon: CheckCircle, title: 'Job Completed', description: 'Electrical service at Spintex', time: '2 hours ago', status: 'completed', to: '/lucid/bookings' },
    { icon: MessageSquare, title: 'New Message', description: 'Client inquiry about electrical work', time: '4 hours ago', status: 'new', to: '/lucid/messages' },
    { icon: Star, title: 'New Review', description: 'Nana Kofi left a 5-star review', time: '1 day ago', status: 'new', to: '/lucid/providers/me' },
    { icon: Calendar, title: 'Booking Confirmed', description: 'Security lights job scheduled for next week', time: '2 days ago', status: 'pending', to: '/lucid/bookings' }
  ];

  const bookings = useMemo(() => activeBookings.slice(0, 3), [activeBookings]);

  const quickActions = [
    { icon: Calendar, label: 'Tasks', to: '/lucid/bookings', badgeCount: unreadBookings },
    { icon: MessageSquare, label: 'Messages', to: '/lucid/messages', badgeCount: unreadMessages },
    { icon: User, label: 'Account', to: '/lucid/account' },
    { icon: Activity, label: 'Analytics', to: '/lucid/earnings' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117]">
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white dark:bg-[#1a1f2e] border-b border-gray-100 dark:border-[#1e293b] sticky top-0 z-30"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <button onClick={handleBackClick} aria-label="Go back" className="p-2 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-lg transition-colors flex-shrink-0">
                <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-slate-300" />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">Dashboard</h1>
                <p className="text-sm text-gray-600 dark:text-slate-400 truncate">Welcome back, {currentUserName}!</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <Link to="/lucid/notifications" onClick={() => setNotificationCount(0)}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative p-3 bg-gray-100 dark:bg-[#252b3b] rounded-lg hover:bg-gray-200 dark:hover:bg-[#1e293b] transition-colors"
                >
                  <Bell className="w-5 h-5 text-gray-700 dark:text-slate-300" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 bg-error rounded-full flex items-center justify-center text-xs text-white font-bold px-1 border-2 border-white">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </motion.button>
              </Link>
              <Link to="/lucid/account/profile">
                <Avatar name={currentUserName} size="md" />
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
          <section>
            <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Overview</h2>
              <PeriodDropdown value={timeframe} onChange={setTimeframe} />
            </motion.div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, i) => <StatCard key={i} {...stat} />)}
            </div>
          </section>

          <section>
            <motion.h2 variants={itemVariants} className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">
              Quick Actions
            </motion.h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action, i) => <QuickAction key={i} {...action} />)}
            </div>
          </section>

          <div className="grid lg:grid-cols-3 gap-8">
            <section className="lg:col-span-2">
              <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Upcoming Bookings</h2>
                <Link to="/lucid/bookings" className="flex items-center gap-2 text-blue-700 dark:text-blue-400 hover:text-primary-hover font-semibold">
                  View All
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </motion.div>
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <DashboardBookingCard key={booking.id} booking={booking} onViewDetails={setSelectedBooking} />
                ))}
              </div>
            </section>

            <section>
              <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Recent Activity</h2>
              </motion.div>
              <motion.div variants={itemVariants} className="bg-white dark:bg-[#1a1f2e] rounded-xl shadow-md divide-y divide-gray-100 dark:divide-[#1e293b]">
                {recentActivities.map((activity, i) => (
                  <ActivityItem key={i} {...activity} />
                ))}
              </motion.div>

              {/* [API] GET /providers/:id/performance-metrics
                   → { satisfactionRate, percentileRank, isTopPerformer, badge: 'Top 10%' | null }
                   The '95%' satisfaction rate and 'top 10%' badge are currently hardcoded. */}
              <motion.div
                variants={itemVariants}
                className="mt-6 bg-gradient-to-br from-primary to-purple-600 rounded-xl p-6 text-white"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Award className="w-8 h-8" />
                  <h3 className="text-xl font-bold">Top Performer!</h3>
                </div>
                <p className="text-blue-100 mb-4">
                  You're in the top 10% of service providers this month!
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">95%</p>
                    <p className="text-sm text-blue-100">Satisfaction Rate</p>
                  </div>
                  <Eye className="w-12 h-12 opacity-20" />
                </div>
              </motion.div>
            </section>
          </div>

          <EarningsChart />
        </motion.div>
      </main>

      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          userType="provider"
          onAccept={handleAccept}
          onDecline={handleDecline}
          onMarkComplete={handleMarkComplete}
          onSubmitPriceAdjustment={handleSubmitPriceAdjustment}
        />
      )}
    </div>
  );
};

export default ProviderDashboard;
