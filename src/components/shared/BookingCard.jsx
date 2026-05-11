// [DB] BookingCard is a pure display component — it renders data fetched by its parent.
// In production, the parent page fetches: GET /bookings?userId={id}&status={...}
// All fields (status, rating, price, location) map directly to columns in the bookings table.
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, DollarSign, Eye, MessageCircle, Star } from 'lucide-react';
import { Avatar, Button } from '../ui';
import { StatusBadge } from '../ui/StatusBadge';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const BookingCard = ({ booking, viewAs = 'client', onView, onCancel }) => {
  const isClient = viewAs === 'client';

  const personName = isClient
    ? (booking.provider?.name ?? 'Service Provider')
    : (booking.client?.name ?? 'Client');

  const locationLabel = [booking.location?.area, booking.location?.city]
    .filter(Boolean)
    .join(', ');

  const isActive = booking.status !== 'cancelled' && booking.status !== 'completed';

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      whileHover={{ scale: 1.01 }}
      className="bg-white rounded-xl p-5 shadow-md hover:shadow-xl transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar name={personName} size="md" />
          <div className="min-w-0">
            <h4 className="font-semibold text-gray-900 truncate">{personName}</h4>
            <p className="text-sm text-gray-600 truncate">{booking.title}</p>
          </div>
        </div>
        <StatusBadge status={booking.status} className="ml-3" />
      </div>

      <p className="text-gray-600 mb-4 text-sm line-clamp-2">{booking.description}</p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
          <span>{booking.date}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4 text-primary flex-shrink-0" />
          <span>{booking.time}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="truncate">{locationLabel || 'No location'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4 text-primary flex-shrink-0" />
          <span>{booking.duration}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          <span className="text-xl font-bold text-gray-900">
            GH₵{booking.price || 0}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {booking.status === 'completed' && booking.rating && (
            <div className="flex items-center gap-1 mr-1">
              <Star className="w-4 h-4 fill-primary text-primary" />
              <span className="text-sm font-semibold text-gray-900">{booking.rating}</span>
            </div>
          )}
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
            // [API] GET /conversations?bookingId={booking.id} — fetch or create the thread,
            // then navigate to /messagePage?conversationId={id} so the right chat opens.
            <Link to="/lucid/messages">
              <Button size="sm">
                <MessageCircle className="w-4 h-4" />
                Chat
              </Button>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
};
