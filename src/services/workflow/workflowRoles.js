export const normalizeWorkflowRole = role => {
  if (role === 'service_provider' || role === 'provider') return 'provider';
  if (role === 'inspector') return 'inspector';
  if (['admin', 'operations', 'operations_admin', 'super_admin', 'hr', 'staff'].includes(role)) return 'admin';
  if (role === 'client') return 'client';
  return role;
};
