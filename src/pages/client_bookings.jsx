import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigateBack } from '../hooks/useNavigateBack.js';
import { useModalBackButton } from '../hooks/useModalBackButton.js';
import { useNotification } from '../contexts/NotificationContext';
import { PageHeader, FilterBar, EmptyState } from '../components/ui';
import { BookingCard, BookingDetailsModal, CancelBookingModal } from '../components/shared';
import { Search, Calendar, AlertCircle } from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const ClientBookings = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);

  const handleBackClick = useNavigateBack('/lucid/dashboard', 600);
  const { showNotification } = useNotification();

  // Browser back / mobile gesture closes the modal instead of leaving the page
  useModalBackButton(!!selectedBooking, () => setSelectedBooking(null));
  useModalBackButton(showCancelModal, () => setShowCancelModal(false));

  // [API] PATCH /bookings/:id/status — {status: 'cancelled', reason?} → {bookingId, status}
  const handleCancel = (booking) => {
    setBookingToCancel(booking);
    setShowCancelModal(true);
    setSelectedBooking(null);
  };

  // [API] PATCH /bookings/:id/status — {status: 'cancelled'} → {bookingId, status}
  const confirmCancel = (booking) => {
    showNotification('Booking cancelled successfully', 'success');
    setShowCancelModal(false);
    setBookingToCancel(null);
  };

  const handleEdit = (booking) => {
    // [API] PATCH /bookings/:id — {updatable fields} → {bookingId, updatedFields}
    showNotification('Edit feature coming soon', 'info');
    setSelectedBooking(null);
  };

  // [API] POST /bookings/:id/completion-requests — {requestedBy, notes} → {requestId, status: 'pending'}
  const handleRequestCompletion = (requestData) => {
    setSelectedBooking((prev) => ({
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

  // [API] POST /payments — {bookingId, amount, paymentMethod, phoneNumber} → {reference, status}
  // Called by BookingDetailsModal after client confirms payment in PaymentModal.
  // Backend Paystack webhook fires on success and credits provider's account (82% of amount).
  const handleProcessPayment = async (paymentData) => {
    // [MOCK] Simulate API call; replace with fetch('/api/payments', { method: 'POST', body: JSON.stringify(paymentData) })
    await new Promise(r => setTimeout(r, 1000));
    showNotification('Payment processed successfully!', 'success');
  };

  // [API] PATCH /bookings/:id/price-adjustment — {action: 'approved'} → updates bookings.agreedPrice
  // Backend must: set agreedPrice = newPrice, status = 'approved', notify provider.
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

  // [API] PATCH /bookings/:id/status — {status: 'completed', paymentStatus: 'paid', paymentData}
  // Called immediately after handleProcessPayment resolves; marks booking complete in local state.
  const handleApproveCompletion = (booking) => {
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

  // [API] PATCH /bookings/:id/completion-requests/:requestId — {status: 'rejected'} → {requestId, status: 'rejected'}
  const handleRejectCompletion = (booking) => {
    setSelectedBooking((prev) => ({ ...prev, completionRequest: null }));
    showNotification('Completion rejected. Communicated changes needed.', 'info');
  };

  // [API] GET /bookings?userId={authenticatedUserId}&status={filter}&sort=date&page={n}&limit={n}
  const bookings = useMemo(() => [], []);

  // [API] Move status counts to API response metadata: GET /bookings?userId={id}&countByStatus=true → {counts: {pending, confirmed, ...}}
  const filters = [
    { key: 'all', label: 'All Bookings', count: bookings.length },
    { key: 'pending', label: 'Pending', count: bookings.filter(b => b.status === 'pending').length },
    { key: 'confirmed', label: 'Confirmed', count: bookings.filter(b => b.status === 'confirmed').length },
    { key: 'in-progress', label: 'In Progress', count: bookings.filter(b => b.status === 'in-progress').length },
    { key: 'completed', label: 'Completed', count: bookings.filter(b => b.status === 'completed').length },
    { key: 'cancelled', label: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled').length }
  ];

  // [API] Move filter/sort/search logic to query params instead of client-side JS filtering
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesFilter = activeFilter === 'all' || booking.status === activeFilter;
      const searchableText = [
        booking.title,
        booking.provider?.name,
        booking.location?.area,
        booking.location?.city
      ].filter(Boolean).join(' ').toLowerCase();
      const matchesSearch = searchableText.includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [bookings, activeFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117]">
      <PageHeader
        title="My Bookings"
        subtitle="Track and manage all your service bookings"
        onBack={handleBackClick}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="mb-8 space-y-4"
        >
          {/* [API] Pass search query as param: GET /bookings?userId={id}&q={searchQuery} */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by service, provider, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-gray-700 dark:text-slate-200 bg-white dark:bg-[#252b3b] border-2 border-gray-200 dark:border-[#2d3748] rounded-lg focus:border-primary focus:outline-none text-base"
            />
          </div>

          <FilterBar filters={filters} active={activeFilter} onChange={setActiveFilter} />
        </motion.div>

        {filteredBookings.length > 0 ? (
          <div className="grid gap-6">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                viewAs="client"
                onView={setSelectedBooking}
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
            action={!searchQuery ? { label: 'Book a Service', to: '/lucid/services' } : undefined}
          />
        )}
      </div>

      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          userType="client"
          onCancel={handleCancel}
          onEdit={handleEdit}
          onRequestCompletion={handleRequestCompletion}
          onApproveCompletion={handleApproveCompletion}
          onRejectCompletion={handleRejectCompletion}
          onMarkComplete={handleApproveCompletion}
          onProcessPayment={handleProcessPayment}
          onApprovePriceAdjustment={handleApprovePriceAdjustment}
          onRejectPriceAdjustment={handleRejectPriceAdjustment}
          onSubmitReview={(reviewData) => {
            // [API] POST /bookings/:id/reviews — {rating, reviewText} → {reviewId, bookingId}
            setSelectedBooking((prev) => ({
              ...prev,
              rating: reviewData.rating,
              review: reviewData.reviewText
            }));
          }}
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

export default ClientBookings;
