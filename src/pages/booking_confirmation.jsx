// ============================================
// BOOKING CONFIRMATION PAGE
// File: src/pages/booking_confirmation.jsx
// ============================================

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  MessageCircle,
  Home,
  FileText,
  Download
} from 'lucide-react';
import { Button, Card } from '../components/ui';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const BookingConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(30);

  // [MOCK] Replace with GET /bookings/:id using bookingId from navigation state; remove reliance on location.state for direct-URL access
  const { bookingData, provider } = location.state || {};

  useEffect(() => {
    // Auto-redirect countdown
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/lucid/bookings');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  if (!bookingData || !provider) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] flex items-center justify-center">
        <Card className="text-center p-8">
          <p className="text-gray-600 mb-4">No booking data found</p>
          <Button onClick={() => navigate('/lucid/')}>Go Home</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="text-center mb-8"
        >
          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.2
            }}
            className="inline-block mb-6"
          >
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
          </motion.div>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100 mb-4">
            Booking Request Sent!
          </h1>
          <p className="text-xl text-gray-600 dark:text-slate-400 mb-2">
            Your booking request has been successfully submitted to {provider.name}
          </p>
          <p className="text-gray-600 dark:text-slate-400">
            Booking Reference: <span className="font-bold text-primary">{bookingData.bookingReference}</span>
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {/* What Happens Next */}
          <Card>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">What Happens Next?</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">Provider Reviews Request</h3>
                  <p className="text-gray-600 dark:text-slate-400">
                    {provider.name} will review your booking details and check availability.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  {/* [WS] Subscribe to booking status channel (e.g., ws://…/bookings/:id/status) for real-time accept/decline notifications */}
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">Confirmation or Discussion</h3>
                  <p className="text-gray-600">
                    You'll receive a notification when the provider confirms or wants to discuss details.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">Service Delivery</h3>
                  <p className="text-gray-600">
                    Once confirmed, the service provider will arrive at the scheduled time.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  {/* [API] POST /payments/initiate — {bookingId, method, phoneNumber} → {paymentRef, status} */}
                  {/* [API] GET /payments/:ref/status — poll until confirmed or use webhook callback */}
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-1">Payment & Review</h3>
                  <p className="text-gray-600">
                    After completion, make payment and leave a review for the service.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Booking Details */}
          {/* [MOCK] Replace with GET /bookings/:id — all fields below should be sourced from API response, not navigation state */}
          <Card>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">Booking Details</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Service Provider</p>
                    <p className="font-semibold text-gray-900 dark:text-slate-100">{provider.name}</p>
                    <p className="text-sm text-gray-600 dark:text-slate-400">{provider.profession}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Service Type</p>
                    <p className="font-semibold text-gray-900 dark:text-slate-100">{bookingData.serviceType}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Preferred Date & Time</p>
                    <p className="font-semibold text-gray-900 dark:text-slate-100">{bookingData.date}</p>
                    <p className="font-semibold text-gray-900 dark:text-slate-100">{bookingData.time}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Location</p>
                    <p className="font-semibold text-gray-900 dark:text-slate-100">{bookingData.location.address}</p>
                    <p className="text-gray-600 dark:text-slate-400">{bookingData.location.area}, {bookingData.location.city}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Contact Person</p>
                    <p className="font-semibold text-gray-900 dark:text-slate-100">{bookingData.client.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Phone Number</p>
                    <p className="font-semibold text-gray-900 dark:text-slate-100">{bookingData.client.phone}</p>
                  </div>
                </div>

                {bookingData.client.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-slate-400">Email</p>
                      <p className="font-semibold text-gray-900 dark:text-slate-100">{bookingData.client.email}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Urgency</p>
                    <p className="font-semibold text-gray-900 dark:text-slate-100 capitalize">
                      {bookingData.urgency}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {bookingData.description && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-[#1e293b]">
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">Description</p>
                <p className="text-gray-900 dark:text-slate-100">{bookingData.description}</p>
              </div>
            )}
          </Card>

          {/* Important Information */}
          <Card className="bg-primary/10 border-2 border-primary/30">
            <div className="flex gap-3">
              <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-primary-dark mb-2">Important Information</h3>
                <ul className="space-y-1 text-sm text-primary-dark/80">
                  {/* [WS] Notification delivery for booking status changes should use WebSocket or push notification service */}
                  <li>• You will receive notifications about your booking status</li>
                  {/* [DB] provider.responseTime should be stored on the provider record and returned by GET /providers/:id */}
                  <li>• The service provider typically responds within {provider.responseTime || '2 hours'}</li>
                  <li>• You can message the provider directly if you have questions</li>
                  {/* [API] POST /notifications/email — {bookingId, recipientEmail, templateId: 'booking_confirmation'} triggered server-side after booking creation */}
                  <li>• A confirmation email has been sent to {bookingData.client.email || 'your email'}</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="grid md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={() => navigate('/lucid/bookings')}
            >
              <FileText className="w-5 h-5" />
              View My Bookings
            </Button>

            {/* [API] Navigating to messages should include conversationId or bookingId as context: GET /conversations?bookingId={id} */}
            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={() => navigate('/lucid/messages')}
            >
              <MessageCircle className="w-5 h-5" />
              Message Provider
            </Button>

            <Button
              size="md"
              fullWidth
              onClick={() => navigate('/lucid/')}
            >
              <Home className="w-5 h-5" />
              Back to Home
            </Button>
          </div>

          {/* Auto-redirect notice */}
          {countdown > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-gray-600 dark:text-slate-400"
            >
              <p>Redirecting to home page in {countdown} seconds...</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
