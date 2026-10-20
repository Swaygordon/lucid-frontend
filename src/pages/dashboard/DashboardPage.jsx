import React from 'react';
import { Navigate } from 'react-router-dom';
import ClientDashboard from './ClientDashboard.jsx';
import ProviderDashboard from './ProviderDashboard.jsx';
import { ClientWorkflowDashboard, ProviderWorkflowDashboard } from './WorkflowRoleDashboard.jsx';
import { useWorkflowMode } from '../../contexts/WorkflowModeContext.jsx';

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] animate-pulse">
      {/* Header bar */}
      <div className="bg-white dark:bg-[#1a1f2e] border-b dark:border-[#1e293b] px-6 py-5 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded-lg w-44" />
          <div className="h-4 bg-gray-100 rounded-lg w-64" />
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-200" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stat cards row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 border h-28 flex flex-col justify-between">
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-7 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>

        {/* Two-column content */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border p-5 space-y-3 h-64">
            <div className="h-5 bg-gray-200 rounded w-36" />
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-gray-100 rounded-xl" />
            ))}
          </div>
          <div className="bg-white rounded-2xl border p-5 h-64">
            <div className="h-5 bg-gray-200 rounded w-28 mb-4" />
            <div className="h-48 bg-gray-100 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { mode, role } = useWorkflowMode();
  if (!role) return <DashboardSkeleton />;
  if (role === 'client') return mode === 'preview' ? <ClientWorkflowDashboard /> : <ClientDashboard />;
  if (role === 'service_provider' || role === 'provider') return mode === 'preview' ? <ProviderWorkflowDashboard /> : <ProviderDashboard />;
  if (['admin', 'hr', 'operations_admin', 'super_admin'].includes(role)) return <Navigate to="/lucid/admin/workflow" replace />;
  if (role === 'inspector') return <Navigate to="/lucid/inspector/visits" replace />;
  return <Navigate to="/lucid/" replace />;
}
