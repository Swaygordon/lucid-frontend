import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigateBack } from '../hooks/useNavigateBack.js';
import { useModalBackButton } from '../hooks/useModalBackButton.js';
import { useNotification } from '../contexts/NotificationContext';
import { PageHeader, FilterBar, EmptyState } from '../components/ui';
import { BookingCard, BookingDetailsModal, CancelBookingModal } from '../components/shared';
import { supabase } from '../lib/supabaseClient';
import { Search, AlertCircle } from 'lucide-react';

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
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const handleBackClick = useNavigateBack('/lucid/dashboard', 600);
  const { showNotification } = useNotification();

  // Browser back / mobile gesture closes the modal instead of leaving the page
  useModalBackButton(!!selectedBooking, () => setSelectedBooking(null));
  useModalBackButton(showCancelModal, () => setShowCancelModal(false));

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        fetchBookings(user.id);
      }
    };
    getUser();
  }, []);

  // Fetch bookings for client with complete details
  const fetchBookings = async (clientId) => {
  try {
    setLoading(true);

    // Get all bookings for the client with all columns
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (bookingsError) throw bookingsError;

    if (!bookingsData || bookingsData.length === 0) {
      setBookings([]);
      return;
    }

    // Get unique provider IDs from bookings
    const providerIds = [...new Set(bookingsData.map(b => b.provider_id).filter(Boolean))];

    // Fetch provider profiles
    let providersMap = {};
    if (providerIds.length > 0) {
      const { data: providersData, error: providersError } = await supabase
        .from('provider_profiles')
        .select('user_id, first_name, last_name, occupation, avatar_url, location, description')
        .in('user_id', providerIds);

      if (!providersError && providersData) {
        providersMap = providersData.reduce((map, p) => {
          map[p.user_id] = {
            name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Service Provider',
            profession: p.occupation || '',
            avatar: p.avatar_url,
            location: p.location,
            description: p.description
          };
          return map;
        }, {});
      }
    }

    // Transform data with ALL the stored details
    const transformedBookings = bookingsData.map(booking => ({
      id: booking.id,
      title: booking.service_type || booking.description?.substring(0, 50) || 'Service Request',
      serviceType: booking.service_type,
      status: booking.status || 'pending',
      date: booking.service_date,
      time: booking.service_time,
      alternateDate: booking.alternate_date,
      alternateTime: booking.alternate_time,
      price: booking.total_amount || 0,
      duration: booking.duration_hours ? `${booking.duration_hours} hours` : 'TBD',
      urgency: booking.urgency || 'normal',
      description: booking.description,
      cancellation_reason: booking.cancellation_reason,
      created_at: booking.created_at,
      updated_at: booking.updated_at,
      // Full location details
      location: {
        full: booking.location,
        address: booking.street_address,
        area: booking.area,
        city: 'Accra',
        landmark: booking.landmark,
        postalCode: booking.postal_code
      },
      // Contact information
      contact: {
        name: booking.contact_name,
        phone: booking.contact_phone,
        email: booking.contact_email
      },
      // Budget
      budget: {
        min: booking.budget_min,
        max: booking.budget_max
      },
      additionalNotes: booking.additional_notes,
      // Provider details
      provider: providersMap[booking.provider_id] || {
        name: 'Service Provider',
        profession: '',
        avatar: null,
        location: '',
        description: ''
      },
      bookingReference: `BK${booking.id.slice(0, 8)}`
    }));

    setBookings(transformedBookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    showNotification('Failed to load bookings', 'error');
  } finally {
    setLoading(false);
  }
};

  // [API] PATCH /bookings/:id/status — {status: 'cancelled', reason?} → {bookingId, status}
  const handleCancel = (booking) => {
    setBookingToCancel(booking);
    setShowCancelModal(true);
    setSelectedBooking(null);
  };

  const confirmCancel = async (booking) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled', 
          updated_at: new Date().toISOString(),
          cancelled_by: currentUser?.id,
          cancellation_reason: 'Cancelled by client'
        })
        .eq('id', booking.id);

      if (error) throw error;

      // Create notification for provider
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('provider_id')
        .eq('id', booking.id)
        .single();

      if (bookingData) {
        await supabase.from('notifications').insert({
          user_id: bookingData.provider_id,
          type: 'booking',
          title: 'Booking Cancelled',
          message: `The client has cancelled the booking.`,
          metadata: { booking_id: booking.id },
          created_at: new Date().toISOString(),
          is_read: false
        });
      }

      showNotification('Booking cancelled successfully', 'success');
      setShowCancelModal(false);
      setBookingToCancel(null);
      
      // Refresh bookings
      if (currentUser) {
        await fetchBookings(currentUser.id);
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      showNotification('Failed to cancel booking', 'error');
    }
  };

  // Count bookings by status
  const statusCounts = useMemo(() => {
    const counts = {
      pending: bookings.filter(b => b.status === 'pending').length,
      accepted: bookings.filter(b => b.status === 'accepted').length,
      in_progress: bookings.filter(b => b.status === 'in_progress').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      total: bookings.length
    };
    return counts;
  }, [bookings]);

  const filters = [
    { key: 'all', label: 'All Bookings', count: statusCounts.total },
    { key: 'pending', label: 'Pending', count: statusCounts.pending },
    { key: 'accepted', label: 'Accepted', count: statusCounts.accepted },
    { key: 'in_progress', label: 'In Progress', count: statusCounts.in_progress },
    { key: 'completed', label: 'Completed', count: statusCounts.completed },
    { key: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled }
  ];

  const filteredBookings = useMemo(() => {
    let filtered = [...bookings];

    if (activeFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === activeFilter);
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(booking =>
        booking.title?.toLowerCase().includes(lowerQuery) ||
        booking.provider?.name?.toLowerCase().includes(lowerQuery) ||
        booking.location?.area?.toLowerCase().includes(lowerQuery) ||
        booking.description?.toLowerCase().includes(lowerQuery)
      );
    }

    return filtered;
  }, [bookings, activeFilter, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by service, provider, description, or location..."
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
        />
      )}

      <CancelBookingModal
        booking={bookingToCancel}
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={() => confirmCancel(bookingToCancel)}
      />
    </div>
  );
};

export default ClientBookings;