import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useWorkflowMode } from '../contexts/WorkflowModeContext.jsx';

const ManagedWorkflowPreviewRoute = () => {
  const { user, canEnablePreview, enablePreview } = useWorkflowMode();
  const [ready, setReady] = useState(false);
  useEffect(() => { if (!user) return; if (canEnablePreview) enablePreview(); setReady(true); }, [user, canEnablePreview, enablePreview]);
  if (!user) return <Navigate to="/lucid/signin" replace />;
  return ready ? <Navigate to="/lucid/dashboard" replace /> : null;
};

export default ManagedWorkflowPreviewRoute;
