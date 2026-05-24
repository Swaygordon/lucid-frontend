import React from 'react';
import { useRole } from '../hooks/useRole';
import ClientBookings from './client_bookings';
import ProviderBookings from './provider_bookings';

function BookingsSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] animate-pulse">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1f2e] border-b dark:border-[#1e293b] px-6 py-5 flex items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-gray-200" />
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded-lg w-36" />
          <div className="h-4 bg-gray-100 rounded-lg w-52" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Tab strip */}
        <div className="flex gap-3">
          <div className="h-9 bg-gray-200 rounded-lg w-24" />
          <div className="h-9 bg-gray-100 rounded-lg w-20" />
        </div>

        {/* Booking cards */}
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-[#1a1f2e] rounded-2xl border dark:border-[#1e293b] p-5 flex gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="flex justify-between">
                <div className="h-5 bg-gray-200 rounded w-40" />
                <div className="h-5 bg-gray-100 rounded w-20" />
              </div>
              <div className="h-4 bg-gray-100 rounded w-56" />
              <div className="flex gap-2">
                <div className="h-8 bg-gray-100 rounded-lg w-24" />
                <div className="h-8 bg-gray-100 rounded-lg w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BookingsPage() {
  const role = useRole();
  if (!role) return <BookingsSkeleton />;
  return role === 'service_provider' ? <ProviderBookings /> : <ClientBookings />;
}
