// @backend-handoff-delete Local mock schema/versioning; remove with the workflow mock store.
export const WORKFLOW_MOCK_SCHEMA_VERSION = 8;

export const isWorkflowMockDatabase = value => Boolean(
  value
  && value.version === WORKFLOW_MOCK_SCHEMA_VERSION
  && Array.isArray(value.cases)
  && Array.isArray(value.messages)
  && Array.isArray(value.notifications)
  && Array.isArray(value.financeEntries)
  && Array.isArray(value.inspectors)
  && Array.isArray(value.receipts),
);
