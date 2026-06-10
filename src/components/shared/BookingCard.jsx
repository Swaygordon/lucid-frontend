// [DB] BookingCard is a pure display component — it renders data fetched by its parent.
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, DollarSign, Eye, MessageCircle, Star, FileText, Mail, Phone, User } from 'lucide-react';
import { Avatar, Button } from '../ui';
import { StatusBadge } from '../ui/StatusBadge';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const BookingCard = ({ booking, viewAs = 'client', onView, onCancel }) => {
  const navigate = useNavigate();
  const isClient = viewAs === 'client';

  const personName = isClient
    ? (booking.provider?.name ?? 'Service Provider')
    : (booking.client?.name ?? 'Client');

  const locationLabel = booking.location?.area 
    ? `${booking.location.area}, ${booking.location.city}` 
    : booking.location?.full || 'Location not specified';

  const isActive = booking.status !== 'cancelled' && booking.status !== 'completed';

  // Format date for display
  const formattedDate = booking.date ? new Date(booking.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) : 'Date TBD';

  const formattedTime = booking.time || 'Time TBD';

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      whileHover={{ scale: 1.01 }}
      className="bg-white dark:bg-[#1a1f2e] rounded-xl p-5 shadow-md hover:shadow-xl transition-all border border-transparent dark:border-[#1e293b]"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar name={personName} size="md" />
          <div className="min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-slate-100 truncate">{personName}</h4>
            <p className="text-sm text-gray-600 dark:text-slate-400 truncate">{booking.title || 'Service Request'}</p>
          </div>
        </div>
        <StatusBadge status={booking.status || 'pending'} className="ml-3" />
      </div>

      {/* Show client contact info for provider view */}
      {!isClient && booking.client && (
        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">Client Contact Information:</p>
          <div className="space-y-1 text-sm">
            {booking.client.contact_name && (
              <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                <User className="w-3 h-3" />
                <span className="text-xs">{booking.client.contact_name}</span>
              </div>
            )}
            {booking.client.contact_phone && (
              <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                <Phone className="w-3 h-3" />
                <span className="text-xs">{booking.client.contact_phone}</span>
              </div>
            )}
            {booking.client.contact_email && (
              <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                <Mail className="w-3 h-3" />
                <span className="text-xs truncate">{booking.client.contact_email}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Show description */}
      {booking.description && (
        <div className="mb-4">
          <p className="text-gray-600 dark:text-slate-400 text-sm line-clamp-2">{booking.description}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
          <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
          <Clock className="w-4 h-4 text-primary flex-shrink-0" />
          <span>{formattedTime}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
          <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="truncate">{locationLabel}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
          <DollarSign className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span className="font-semibold">GH₵{booking.price || 0}</span>
        </div>
        {booking.duration && booking.duration !== 'TBD' && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
            <Clock className="w-4 h-4 text-primary flex-shrink-0" />
            <span>Duration: {booking.duration}</span>
          </div>
        )}
        {booking.urgency && booking.urgency !== 'normal' && (
          <div className="flex items-center gap-2 text-sm">
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              booking.urgency === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
            }`}>
              {booking.urgency.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Show budget if provided */}
      {(booking.budget?.min || booking.budget?.max) && (
        <div className="mb-3 text-xs text-gray-500 dark:text-slate-400">
          Budget: GH₵{booking.budget.min || 0} - GH₵{booking.budget.max || 0}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-[#1e293b]">
        <div className="flex items-center gap-2">
          {booking.status === 'completed' && booking.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-primary text-primary" />
              <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">{booking.rating}</span>
            </div>
          )}
          {booking.status === 'cancelled' && booking.cancellation_reason && (
            <span className="text-xs text-red-600 truncate max-w-[200px]">
              Reason: {booking.cancellation_reason}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onView && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(booking)}
            >
              <Eye className="w-4 h-4" />
              Details
            </Button>
          )}
          {isActive && (
            <Button 
              size="sm" 
              onClick={() => navigate(`/lucid/messages?bookingId=${booking.id}`)}
            >
              <MessageCircle className="w-4 h-4" />
              Chat
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};