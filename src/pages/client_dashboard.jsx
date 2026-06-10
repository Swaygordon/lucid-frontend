import React, { useState, useMemo, useEffect, useRef } from 'react';
import ServicesMap from '../components/ServicesMap.jsx';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useNavigateBack } from '../hooks/useNavigateBack.js';
import { useNotification } from '../contexts/NotificationContext';
import { useFavourites } from '../contexts/FavouritesContext';
import { Avatar, StatCard } from '../components/ui';
import { BookingDetailsModal, CancelBookingModal } from '../components/shared';
import { supabase } from '../lib/supabaseClient';
import {
  ArrowLeft, Search, Calendar, DollarSign, Star, Clock, CheckCircle,
  Heart, MapPin, MessageSquare, Bell, ChevronRight, ChevronDown, Filter, User
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

// Mini booking card used only on the dashboard — full booking actions live in client_bookings
const DashboardBookingCard = ({ booking, onViewDetails }) => {
  const providerName = booking.provider?.name ?? 'Service Provider';
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
          <Avatar name={providerName} size="md" />
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-slate-100">{providerName}</h4>
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

const ProviderCard = ({ name, profession, rating, jobs, isFavorite }) => {
  const [favorite, setFavorite] = useState(isFavorite);

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-[#1a1f2e] rounded-xl p-4 shadow-md hover:shadow-xl transition-all relative"
    >
      <button
        onClick={() => setFavorite(!favorite)}
        className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-[#252b3b] rounded-full transition-colors"
      >
        <Heart className={`w-5 h-5 ${favorite ? 'fill-error text-error' : 'text-gray-400 dark:text-slate-500'}`} />
      </button>

      <div className="flex flex-col items-center text-center mb-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-light to-purple-600 flex items-center justify-center text-white font-bold text-xl mb-3">
          {name.split(' ').map(n => n[0]).join('')}
        </div>
        <h3 className="font-bold text-gray-900 dark:text-slate-100">{name}</h3>
        <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">{profession}</p>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-primary text-primary" />
            <span className="font-semibold text-gray-900 dark:text-slate-100">{rating}</span>
          </div>
          <span className="text-gray-400 dark:text-slate-500">•</span>
          <span className="text-sm text-gray-600 dark:text-slate-400">{jobs} jobs</span>
        </div>
      </div>

      <Link to="/lucid/providers/me">
        <button className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-semibold">
          View Profile
        </button>
      </Link>
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

const ActivityItem = ({ icon: Icon, title, description, time, actionLabel, to }) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ x: 5 }}
    className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-[#252b3b] rounded-lg transition-colors"
  >
    <Link to={to} className="flex gap-4 flex-1">
      <div className="w-9 h-9 p-2 bg-primary-50 dark:bg-primary/10 rounded-lg">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">{description}</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-600 dark:text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {time}
          </p>
          {actionLabel && (
            <span className="text-xs text-primary font-semibold">
              {actionLabel}
            </span>
          )}
        </div>
      </div>
    </Link>
  </motion.div>
);

const ClientDashboard = () => {
  const [currentUserName, setCurrentUserName] = useState('there');
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

  const [timeframe, setTimeframe] = useState('month');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  // [API] GET /notifications/count?userId={id}&read=false → { count: number }
  // [WS] Subscribe to 'notification' events on the user's WebSocket channel to update in real time.
  const [notificationCount, setNotificationCount] = useState(5);
  // [API] GET /messages/unread-count?userId={id} → { count: number }
  const [unreadMessages] = useState(3);
  // [API] GET /bookings/new-count?clientId={id} — bookings not yet viewed by client
  const [unreadBookings] = useState(5);

  const handleBackClick = useNavigateBack('/lucid/', 600);
  const { showNotification } = useNotification();
  const { favouriteProviders } = useFavourites();

  const handleCancel = (booking) => {
    setBookingToCancel(booking);
    setShowCancelModal(true);
    setSelectedBooking(null);
  };

  const confirmCancel = async (booking) => {
    // [API] POST /bookings/:id/cancel  { reason: 'Client requested', requestedBy: 'client' }
    // On success: refetch allBookings or remove the cancelled booking from local state.
    showNotification('Booking cancelled successfully', 'success');
    setShowCancelModal(false);
    setBookingToCancel(null);
  };

  const handleEdit = () => {
    showNotification('Edit feature coming soon', 'info');
    setSelectedBooking(null);
  };

  // [API] PATCH /bookings/:id/price-adjustment — {action: 'approved'} → updates bookings.agreedPrice
  const handleApprovePriceAdjustment = (booking) => {
    setSelectedBooking(prev => prev ? {
      ...prev,
      originalPrice: prev.agreedPrice || prev.price,
      agreedPrice: prev.priceAdjustment.newPrice,
      price: prev.priceAdjustment.newPrice,
      priceAdjustment: { ...prev.priceAdjustment, status: 'approved' }
    } : null);
    showNotification('Price adjustment approved. Updated amount will be used for payment.', 'success');
  };

  // [API] PATCH /bookings/:id/price-adjustment — {action: 'rejected'} → reverts to original price
  const handleRejectPriceAdjustment = (booking) => {
    setSelectedBooking(prev => prev ? { ...prev, priceAdjustment: null } : null);
    showNotification('Price adjustment rejected. Original price remains.', 'info');
  };

  // [API] POST /payments — {bookingId, amount, paymentMethod, phoneNumber} → {reference, status}
  const handleProcessPayment = async (paymentData) => {
    await new Promise(r => setTimeout(r, 1000));
    showNotification('Payment processed successfully!', 'success');
  };

  // [API] PATCH /bookings/:id/status — {status: 'completed', paymentStatus: 'paid'}
  const handleMarkComplete = (booking) => {
    setSelectedBooking(prev => prev ? {
      ...prev,
      status: 'completed',
      paymentStatus: 'paid',
      completionRequest: prev.completionRequest
        ? { ...prev.completionRequest, status: 'approved' }
        : undefined,
    } : null);
    showNotification('Booking marked as complete!', 'success');
  };

  // [API] GET /bookings?clientId={authenticatedUserId}&status=pending,confirmed,in-progress
  const allBookings = useMemo(() => [], []);
  const bookingStats = useMemo(() => ({
    total: 0, completed: 0, pending: 0, confirmed: 0, inProgress: 0, cancelled: 0,
    totalEarnings: 0, avgRating: 'N/A', active: 0, totalRevenue: 0, completionRate: 0,
  }), []);

  const activeBookings = useMemo(() =>
    allBookings.filter(b => ['pending', 'confirmed', 'in-progress'].includes(b.status)),
    [allBookings]
  );

  // [API] Stats (change %, trend) should come from: GET /users/:id/stats?period={timeframe}
  // → { activeBookings, completedJobs, totalSpent, favouritesCount, weekOverWeekChange: {...} }
  // All change values are hardcoded placeholders; favourites count comes from context.
  const stats = useMemo(() => [
    { icon: Calendar, title: 'Active Bookings', value: bookingStats.active.toString(), change: '+1', trend: 'up', color: 'blue' },
    { icon: CheckCircle, title: 'Completed Jobs', value: bookingStats.completed.toString(), change: '+3', trend: 'up', color: 'green' },
    { icon: DollarSign, title: 'Total Spent', value: `GH₵${bookingStats.totalRevenue}`, change: '+15%', trend: 'up', color: 'purple' },
    { icon: Heart, title: 'Favourites', value: favouriteProviders.length.toString(), change: null, trend: 'up', color: 'orange', to: '/lucid/favourites' }
  ], [bookingStats, favouriteProviders.length]);

  const bookings = useMemo(() => activeBookings.slice(0, 3), [activeBookings]);

  // [MOCK] Replace with: GET /activity-feed?userId={id}&limit=4
  // → [{ type: 'booking_completed'|'new_message'|'booking_confirmed'|'review_posted',
  //       title, description, timestamp, relatedId, relatedRoute }]
  // The `time` field should use a relative-time formatter (e.g. date-fns formatDistanceToNow).
  const recentActivities = [
    { icon: CheckCircle, title: 'Service Completed', description: 'Plumbing repair at Osu completed successfully', time: '2 hours ago', actionLabel: 'Leave Review', to: '/lucid/bookings' },
    { icon: MessageSquare, title: 'New Message', description: 'Gabriel replied to your inquiry', time: '4 hours ago', actionLabel: 'View Message', to: '/lucid/messages' },
    { icon: Calendar, title: 'Booking Confirmed', description: 'Electrical installation scheduled for tomorrow', time: '1 day ago', actionLabel: null, to: '/lucid/bookings' },
    { icon: Star, title: 'Review Posted', description: 'Your review for John Mensah has been published', time: '2 days ago', actionLabel: null, to: '/lucid/providers/me' }
  ];

  const quickActions = [
    { icon: Search, label: 'Find Services', to: '/lucid/services' },
    { icon: Calendar, label: 'Bookings', to: '/lucid/bookings', badgeCount: unreadBookings },
    { icon: Heart, label: 'Favourites', to: '/lucid/favourites' },
    { icon: User, label: 'Account', to: '/lucid/account' },
    { icon: MessageSquare, label: 'Messages', to: '/lucid/messages', badgeCount: unreadMessages }
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
              <Link to="/lucid/account">
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
              {stats.map((stat, i) =>
                stat.to ? (
                  <Link key={i} to={stat.to} className="block">
                    <StatCard {...stat} />
                  </Link>
                ) : (
                  <StatCard key={i} {...stat} />
                )
              )}
            </div>
          </section>

          <section>
            <motion.h2 variants={itemVariants} className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">
              Quick Actions
            </motion.h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {quickActions.map((action, i) => <QuickAction key={i} {...action} />)}
            </div>
          </section>

          <div className="grid lg:grid-cols-3 gap-8">
            <section className="lg:col-span-2">
              <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Active Bookings</h2>
                <Link to="/lucid/bookings" className="flex items-center gap-2 text-primary hover:text-primary-hover font-semibold">
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
            </section>
          </div>

          <motion.section variants={itemVariants}>
            <div className="bg-white dark:bg-[#1a1f2e] rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Services Near You</h2>
                  <p className="text-gray-600 dark:text-slate-400 mt-1">Showing providers within 5km radius</p>
                </div>
                <button className="px-4 py-2 text-primary hover:bg-primary-50 dark:hover:bg-primary/10 rounded-lg font-semibold transition-colors flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
              </div>
              {/* [API] GET /providers/nearby?lat={userLat}&lng={userLng}&radius=5
                   Requires browser Geolocation API (navigator.geolocation.getCurrentPosition).
                   The ServicesMap component will need real lat/lng coords, not mock provider objects. */}
              {/* [API] GET /providers/nearby?lat={userLat}&lng={userLng}&radius=5 */}
              <ServicesMap providers={[]} />
            </div>
          </motion.section>
        </motion.div>
      </main>

      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          userType="client"
          onCancel={handleCancel}
          onEdit={handleEdit}
          onMarkComplete={handleMarkComplete}
          onProcessPayment={handleProcessPayment}
          onApprovePriceAdjustment={handleApprovePriceAdjustment}
          onRejectPriceAdjustment={handleRejectPriceAdjustment}
        />
      )}

      <CancelBookingModal
        booking={bookingToCancel}
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={confirmCancel}
      />
    </div>
  );
};

export default ClientDashboard;
