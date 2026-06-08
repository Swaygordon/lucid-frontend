import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigateBack } from '../hooks/useNavigateBack.js';
import { useNotification } from '../contexts/NotificationContext.jsx';
import { PageHeader, FilterBar, EmptyState } from '../components/ui';
import { BookingCard, BookingDetailsModal, CancelBookingModal } from '../components/shared';
import { supabase } from '../lib/supabaseClient';
import { Search, AlertCircle } from 'lucide-react';

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
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const handleBackClick = useNavigateBack('/lucid/dashboard', 600);

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

  // Fetch bookings for provider with complete client details
  const fetchBookings = async (providerId) => {
    try {
      setLoading(true);
      
      // Get all bookings for the provider
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      if (!bookingsData || bookingsData.length === 0) {
        setBookings([]);
        return;
      }

      // Get unique client IDs from bookings
      const clientIds = [...new Set(bookingsData.map(b => b.client_id).filter(Boolean))];
      
      // Fetch client profiles (from profiles table)
      let clientsMap = {};
      if (clientIds.length > 0) {
        const { data: clientsData, error: clientsError } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone, user_type')
          .in('id', clientIds);
        
        if (!clientsError && clientsData) {
          clientsMap = clientsData.reduce((map, c) => {
            map[c.id] = {
              name: c.full_name || 'Client',
              email: c.email || '',
              phone: c.phone || '',
              user_type: c.user_type || 'client'
            };
            return map;
          }, {});
        }
      }

      // Transform data with ALL client details
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
        
        // Client details (what the client filled in the form)
        client: {
          id: booking.client_id,
          name: clientsMap[booking.client_id]?.name || 'Client',
          email: clientsMap[booking.client_id]?.email || booking.contact_email,
          phone: clientsMap[booking.client_id]?.phone || booking.contact_phone,
          contact_name: booking.contact_name,
          contact_phone: booking.contact_phone,
          contact_email: booking.contact_email
        },
        
        // Location details
        location: { 
          full: booking.location,
          address: booking.street_address,
          area: booking.area,
          city: 'Accra',
          landmark: booking.landmark,
          postalCode: booking.postal_code
        },
        
        // Budget
        budget: {
          min: booking.budget_min,
          max: booking.budget_max
        },
        
        // Additional notes
        additionalNotes: booking.additional_notes,
        
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

  // Update booking status
  const updateBookingStatus = async (bookingId, status, notificationMessage) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (error) throw error;

      // Get the booking to find client_id
      const { data: booking } = await supabase
        .from('bookings')
        .select('client_id, contact_name, service_type')
        .eq('id', bookingId)
        .single();

      if (booking) {
        // Create notification for client
        await supabase.from('notifications').insert({
          user_id: booking.client_id,
          type: 'booking',
          title: `Booking ${status === 'accepted' ? 'Accepted' : status === 'in_progress' ? 'In Progress' : 'Completed'}`,
          message: notificationMessage,
          metadata: { booking_id: bookingId, status: status },
          created_at: new Date().toISOString(),
          is_read: false
        });
      }

      // Refresh bookings
      if (currentUser) {
        await fetchBookings(currentUser.id);
      }

      return true;
    } catch (error) {
      console.error('Error updating booking:', error);
      showNotification('Failed to update booking status', 'error');
      return false;
    }
  };

  const handleAcceptTask = async (task) => {
    const success = await updateBookingStatus(
      task.id,
      'accepted',
      `Your booking has been accepted by the service provider. They will contact you shortly.`
    );
    if (success) {
      showNotification('Booking accepted successfully!', 'success');
      setSelectedTask(null);
    }
  };

  const handleDeclineTask = async (task) => {
    const success = await updateBookingStatus(
      task.id,
      'cancelled',
      `Your booking request was declined. Please try booking another provider.`
    );
    if (success) {
      showNotification('Booking declined', 'info');
      setSelectedTask(null);
    }
  };

  const handleMarkComplete = async (task) => {
    const success = await updateBookingStatus(
      task.id,
      'completed',
      `Your booking has been marked as complete. Please confirm completion and leave a review.`
    );
    if (success) {
      showNotification('Job marked as complete!', 'success');
      setSelectedTask(null);
    }
  };

  const handleMarkInProgress = async (task) => {
    const success = await updateBookingStatus(
      task.id,
      'in_progress',
      `The service provider has started working on your booking.`
    );
    if (success) {
      showNotification('Job marked as in progress!', 'success');
      setSelectedTask(null);
    }
  };

  const handleCancel = (booking) => {
    setBookingToCancel(booking);
    setShowCancelModal(true);
    setSelectedTask(null);
  };

  const confirmCancel = async (booking) => {
    const success = await updateBookingStatus(
      booking.id,
      'cancelled',
      `Your booking has been cancelled by the service provider.`
    );
    if (success) {
      showNotification('Booking cancelled successfully', 'success');
      setShowCancelModal(false);
      setBookingToCancel(null);
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
      filtered = filtered.filter(task => task.status === activeFilter);
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title?.toLowerCase().includes(lowerQuery) ||
        task.client?.name?.toLowerCase().includes(lowerQuery) ||
        task.location?.area?.toLowerCase().includes(lowerQuery) ||
        task.description?.toLowerCase().includes(lowerQuery)
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
        subtitle="Manage all your bookings and client requests"
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
              placeholder="Search by service, client name, description, or location..."
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
          onAccept={() => handleAcceptTask(selectedTask)}
          onDecline={() => handleDeclineTask(selectedTask)}
          onCancel={handleCancel}
          onMarkComplete={() => handleMarkComplete(selectedTask)}
          onMarkInProgress={() => handleMarkInProgress(selectedTask)}
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

export default ProviderBookings;