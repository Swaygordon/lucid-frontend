import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigateBack } from '../hooks/useNavigateBack.js';
import { useModalBackButton } from '../hooks/useModalBackButton.js';
import { useNotification } from '../contexts/NotificationContext.jsx';
import { PageHeader, FilterBar, EmptyState } from '../components/ui';
import { BookingCard, BookingDetailsModal, CancelBookingModal } from '../components/shared';
import { Search, Calendar, AlertCircle } from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const ProviderBookings = () => {
  const { showNotification } = useNotification();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const handleBackClick = useNavigateBack('/lucid/dashboard', 400);

  // Browser back / mobile gesture closes the modal instead of leaving the page
  useModalBackButton(!!selectedTask, () => setSelectedTask(null));
  useModalBackButton(showCancelModal, () => setShowCancelModal(false));

  // [API] GET /bookings?providerId={authenticatedProviderId}&status={filter}&sort=date&page={n}&limit={n}
  const bookings = useMemo(() => [], []);

  // [API] Move status counts to API response metadata: GET /bookings?providerId={id}&countByStatus=true → {counts: {pending, confirmed, ...}}
  const filters = [
    { key: 'all', label: 'All Bookings', count: bookings.length },
    { key: 'pending', label: 'Pending', count: bookings.filter(t => t.status === 'pending').length },
    { key: 'confirmed', label: 'Confirmed', count: bookings.filter(t => t.status === 'confirmed').length },
    { key: 'in-progress', label: 'In Progress', count: bookings.filter(t => t.status === 'in-progress').length },
    { key: 'completed', label: 'Completed', count: bookings.filter(t => t.status === 'completed').length },
    { key: 'cancelled', label: 'Cancelled', count: bookings.filter(t => t.status === 'cancelled').length }
  ];

  // [API] Move filter/search logic to query params instead of client-side JS filtering
  const filteredBookings = useMemo(() => {
    return bookings.filter((task) => {
      const matchesFilter = activeFilter === 'all' || task.status === activeFilter;
      const searchableText = [
        task.title,
        task.client?.name,
        task.location?.area,
        task.location?.city
      ].filter(Boolean).join(' ').toLowerCase();
      const matchesSearch = searchableText.includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [bookings, activeFilter, searchQuery]);

  // [API] PATCH /bookings/:id/status — {status: 'confirmed'} → {bookingId, status}
  const handleAcceptTask = (task) => {
    showNotification('Task accepted successfully!', 'success');
    setSelectedTask(null);
  };

  // [API] PATCH /bookings/:id/status — {status: 'declined'} → {bookingId, status}
  const handleDeclineTask = (task) => {
    showNotification('Task declined', 'info');
    setSelectedTask(null);
  };

  // [API] PATCH /bookings/:id/status — {status: 'completed'} → {bookingId, status}
  const handleMarkComplete = (task) => {
    showNotification('Job marked as complete!', 'success');
    setSelectedTask(null);
  };

  // [API] PATCH /bookings/:id/status — {status: 'cancelled', reason?} → {bookingId, status}
  const handleCancel = (booking) => {
    setBookingToCancel(booking);
    setShowCancelModal(true);
    setSelectedTask(null);
  };

  // [API] PATCH /bookings/:id/status — {status: 'cancelled'} → {bookingId, status}
  const confirmCancel = (booking) => {
    showNotification('Booking cancelled successfully', 'success');
    setShowCancelModal(false);
    setBookingToCancel(null);
  };

  // [API] POST /bookings/:id/completion-requests — {requestedBy: 'provider', notes} → {requestId, status: 'pending'}
  const handleRequestCompletion = (requestData) => {
    setSelectedTask((prev) => ({
      ...prev,
      completionRequest: {
        status: 'pending',
        requestedBy: requestData.requestedBy,
        notes: requestData.notes,
        timestamp: requestData.timestamp
      }
    }));
    showNotification('Completion request sent! Awaiting confirmation.', 'success');
  };

  // [API] POST /bookings/:id/price-adjustment — {originalPrice, newPrice, reason} → {adjustmentId, status: 'pending'}
  // Backend must notify client to approve/reject. agreedPrice only updates on client approval.
  const handleSubmitPriceAdjustment = (adjustmentData) => {
    setSelectedTask(prev => prev ? {
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117]">
      <PageHeader
        title="My Bookings"
        subtitle="Manage all your bookings and appointments"
        onBack={handleBackClick}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="mb-8 space-y-4"
        >
          {/* [API] Pass search query as param: GET /bookings?providerId={id}&q={searchQuery} */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, client, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-gray-700 dark:text-slate-200 bg-white dark:bg-[#252b3b] border-2 border-gray-200 dark:border-[#2d3748] rounded-lg focus:border-primary focus:outline-none text-base"
            />
          </div>

          <FilterBar filters={filters} active={activeFilter} onChange={setActiveFilter} />
        </motion.div>

        {filteredBookings.length > 0 ? (
          <div className="grid gap-6">
            {filteredBookings.map((task) => (
              <BookingCard
                key={task.id}
                booking={task}
                viewAs="provider"
                onView={setSelectedTask}
                onCancel={handleCancel}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={AlertCircle}
            heading="No bookings found"
            description={
              searchQuery
                ? 'Try adjusting your search terms'
                : "You don't have any bookings in this category"
            }
          />
        )}
      </div>

      {selectedTask && (
        <BookingDetailsModal
          booking={selectedTask}
          onClose={() => setSelectedTask(null)}
          userType="provider"
          onAccept={handleAcceptTask}
          onDecline={handleDeclineTask}
          onCancel={handleCancel}
          onMarkComplete={handleMarkComplete}
          onRequestCompletion={handleRequestCompletion}
          onSubmitPriceAdjustment={handleSubmitPriceAdjustment}
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

export default ProviderBookings;
