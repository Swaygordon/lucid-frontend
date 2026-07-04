import React from 'react';
import { useRole } from '../hooks/useRole';
import ClientAccountOverview from './client_account_overview';
import ProviderAccountOverview from './provider_account_overview';

function AccountSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1117] flex items-center justify-center p-5 pb-20 md:pb-5 animate-pulse">
      <div className="w-full mt-20 md:mt-0 max-w-5xl grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-8">

        {/* Profile card */}
        <div className="md:col-span-2 lg:mt-24 bg-white rounded-3xl p-8 border shadow-sm flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-gray-200 mb-4" />
          <div className="h-9 bg-gray-200 rounded-xl w-36 mb-5" />
          <div className="h-5 bg-gray-100 rounded w-48 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-32 mb-6" />
          <div className="w-full h-24 bg-gray-100 rounded-2xl" />
        </div>

        {/* Nav items */}
        <div className="md:col-span-3 lg:mt-24 flex flex-col gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white border-2 border-gray-100 rounded-2xl p-5 h-20 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-36" />
                <div className="h-3 bg-gray-100 rounded w-52" />
              </div>
            </div>
          ))}
          <div className="h-14 bg-gray-100 rounded-2xl mt-2" />
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const role = useRole();
  if (!role) return <AccountSkeleton />;
  return role === 'service_provider' ? <ProviderAccountOverview /> : <ClientAccountOverview />;
}
