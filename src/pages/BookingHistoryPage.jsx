import React from 'react';
import { useRole } from '../hooks/useRole';
import ClientHistory from './client_history';
import ProviderHistory from './provider_history';

function HistorySkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] animate-pulse">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1f2e] border-b dark:border-[#1e293b] px-6 py-5 flex items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-gray-200" />
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded-lg w-40" />
          <div className="h-4 bg-gray-100 rounded-lg w-56" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Filter / period selector */}
        <div className="flex gap-3">
          <div className="h-9 bg-gray-200 rounded-lg w-28" />
          <div className="h-9 bg-gray-100 rounded-lg w-24" />
          <div className="h-9 bg-gray-100 rounded-lg w-20" />
        </div>

        {/* History cards */}
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white dark:bg-[#1a1f2e] rounded-2xl border dark:border-[#1e293b] p-5 flex gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="flex justify-between">
                <div className="h-5 bg-gray-200 rounded w-44" />
                <div className="h-5 bg-gray-100 rounded w-16" />
              </div>
              <div className="h-4 bg-gray-100 rounded w-60" />
              <div className="h-4 bg-gray-100 rounded w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BookingHistoryPage() {
  const role = useRole();
  if (!role) return <HistorySkeleton />;
  return role === 'service_provider' ? <ProviderHistory /> : <ClientHistory />;
}
