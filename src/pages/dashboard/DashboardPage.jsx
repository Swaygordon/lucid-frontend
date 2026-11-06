import React from 'react';
import { Navigate } from 'react-router-dom';
import { ClientWorkflowDashboard } from './WorkflowRoleDashboard.jsx';
import { useWorkflowMode } from '../../contexts/WorkflowModeContext.jsx';
import { normalizeWorkflowRole } from '../../services/workflow/workflowRoles.js';
import { WorkspaceOverviewSkeleton } from '../../app/components/RouteSkeletons.jsx';

export default function DashboardPage() {
  const { role } = useWorkflowMode();
  if (!role) return <WorkspaceOverviewSkeleton />;
  const normalizedRole = normalizeWorkflowRole(role);
  if (normalizedRole === 'client') return <ClientWorkflowDashboard />;
  if (normalizedRole === 'provider') return <Navigate to="/lucid/provider/work" replace />;
  if (normalizedRole === 'admin') return <Navigate to="/lucid/admin/workflow" replace />;
  if (normalizedRole === 'inspector') return <Navigate to="/lucid/inspector/visits" replace />;
  return <Navigate to="/lucid/" replace />;
}
