# Local workflow mock adapter

> **Backend handoff:** every file in this directory is disposable Preview-only implementation and carries the `@backend-handoff-delete` source marker. See [Preview frontend removal checklist](../../../docs/backend/PREVIEW_FRONTEND_REMOVAL_CHECKLIST.md) for the removal order and boundaries.

This is the active data source for all authenticated Preview pages. Sign-in identities and workflow records are browser-local. No password authentication, authorization, account, or workflow API is called. Replace this adapter only when the new authenticated backend implementation is ready; public service discovery remains outside this boundary.

This folder contains the development-only mock dataset and repository:

- `seed.js` creates fictional workflow cases, role profiles, messages, notifications, receipts and finance records.
- `schema.js` defines the local storage version and minimum shape check.
- `store.js` reads, writes, migrates and resets the browser-local store.
- `transitions.js` validates the current demo case state transitions.
- `service.js` exposes mock case, Inspector eligibility/proximity search and assignment, local role-profile setup, role-specific receipts, reviews, message, finance and notification methods.

The current local schema is version 8. Request amendments remain proposals until Client acknowledgement; Inspector assignment stores the selected candidate, estimated distance and any out-of-radius reason in case history. Role setup, reviews, receipt records, finance entries and workflow updates remain browser-local. Payout account details are not collected in Preview.

Pages must not import files from this folder. `src/services/workflow/workflowService.js` is the composition boundary. All fixtures and Preview profiles are synthetic; never place live user, address, contact, credential or payment data here. Local sign-in is a UI prototype and must not be deployed as real authentication.

When the new backend replaces this mock, keep the shared service contracts and role-aware screens, replace the mock adapter and local auth boundary, then remove local Preview controls after checking for direct imports.
