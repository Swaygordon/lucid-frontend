# Frontend backend-handoff audit and fix log

**Audit date:** 6 November 2026
**Scope:** public routes, authentication boundaries, role workspaces, workflow services, payout/payment UI, migration drafts, repository handoff documentation, and launch catalog consistency.

## Findings and changes made

| Finding | Risk | Change |
|---|---|---|
| Sign-in let the user choose an account type and could create role assumptions. | Admin discovery and role claims were unsafe; the UI did not represent server-verified identity. | Sign-in now accepts email/password only. Signup exposes Client, Provider and Inspector. Admin is IT-provisioned. Workflow identity resolves through Supabase Auth and trusted profile/staff membership. |
| Runtime routes and service composition could be mistaken for complete backend behavior. | A backend engineer could mistake client-side state for persisted, authorized workflow transitions. | Removed the non-production workflow runtime and its routes. Retained the designed screens and Supabase service boundary; unsupported operations now return explicit errors. |
| Missing Supabase environment configuration could look like successful empty data. | Users and developers could mistake missing backend configuration for a real empty account. | Supabase client now fails closed with an explicit configuration error. Workflow operations that have no backend implementation return `BACKEND_OPERATION_NOT_IMPLEMENTED`, not success. |
| Provider finance UI used locally collected payout details and browser-only withdrawal completion. | Sensitive data could be stored in the wrong place and payout completion falsely claimed. | Replaced with server-owned payout readiness and a hosted onboarding URL integration point. No raw bank/MoMo data is collected in the LUCID UI. |
| Client requests and legacy SQL mixed a budget with a binding price; financial rates could be edited in the UI. | Conflicting bill expectations and untrusted fee calculation. | Request range is optional/non-binding; payment and payout totals are described as server-calculated. Client checkout is a hosted gateway integration point. |
| Cancellation UI contained a fixed GHS 75 amount. | A policy example could be charged without board approval or a transparent rule. | Removed the fixed amount and client-side fee calculation. Fee and applicability must come from an approved backend policy; fee policy remains undecided. |
| Admin confirmation text implied a payment action; payout/status labels implied ledger records existed. | UI suggested financial state changes without a gateway or audit record. | Replaced those labels with backend-owned state language. Real payment and payout state still requires gateway-backed server operations. |
| Account setup did not read profile completion consistently. | Setup banner could be wrong or remain incomplete after profile completion. | Profile adapter now requests the `profile_complete` field. Backend schema must include and maintain that field. |
| Earlier backend guide described an obsolete bill approval/inspection gate. | Backend implementation could contradict the agreed workflow. | Rewrote the handoff guide with the current lifecycle, Supabase schema proposal, RLS and Edge Function responsibilities, page/service method map, gateway contract, storage controls and acceptance matrix. |
| Git ignore rules excluded all docs and could also exclude the backend handoff. | Backend developer might not receive implementation instructions. | `.gitignore` ignores non-backend working documentation while allowing `docs/backend/**`; local artifacts and secrets remain excluded. |

## Verification results

- `npm.cmd run lint`: **passed** after final source edits.
- `npm.cmd run build`: passed during the source handoff; Vite reports a generated chunk larger than 500 kB. Bundle splitting is an optimization follow-up, not a build failure.
- No general workflow test script is defined in `package.json`. Live workflow scenarios require backend implementations and staging credentials; the required test coverage is specified in the implementation guide.
- A public-route Puppeteer walkthrough previously loaded `/lucid/`, `/lucid/about`, `/lucid/help`, `/lucid/services`, `/lucid/services/all`, `/lucid/signup` and `/lucid/signin`; Signup had only Client/Provider/Inspector, Sign-in had no role selector, and unauthenticated `/lucid/cases` redirected to Sign-in. Final Puppeteer smoke passed after source cleanup on a 390×844 viewport: all seven listed public routes returned HTTP 200 with page content; signup role options were exactly Client, Service provider, Inspector; sign-in had no role selector; unauthenticated `/lucid/cases` redirected to `/lucid/signin`. This validates route rendering only, not public search backend behavior.
- No live Supabase environment, service-role setup, staging data or payment gateway credentials were available. Auth, workflow persistence, RLS, actual messages, payment checkout, payouts, receipts and notifications could not be exercised against services.
- Backend work needs automated tests against Supabase migrations, RLS, RPCs, Edge Functions, gateway webhooks, and role-based browser journeys.

## Remaining blockers before production

1. `src/services/workflow/liveWorkflowService.js` contains explicit unsupported operations. Request creation, case transitions, assignments, payments, finance, receipts, notifications, profile writes, appeals and Admin queues still require Supabase RPC/Edge Function implementation.
2. The live adapter's database selects, row shapes and UI models need a formal, tested mapping. It currently does not fully provide the nested case model expected by all case screens.
3. Supabase project credentials, schema, deployment settings, RLS and staging users were unavailable. Role isolation and live persistence remain untested.
4. The payment/payout gateway is not selected. Hosted checkout/onboarding, signed webhooks, ledger, refunds, transfers, idempotency and reconciliation remain to be implemented.
5. Existing SQL files are historical drafts and do not implement the latest full state machine. Review against the actual deployed schema and this guide before applying any migration.
6. Cancellation fee policy and final service/platform/Inspector charge rates are Board decisions; do not collect a cancellation fee or hardcode rates before approval and disclosure.
7. Email/SMS/push providers and credentials are not configured. Notification delivery, consent and retries are unverified.
8. Current verification does not establish production readiness, accessibility conformance, security or legal compliance. Have qualified reviewers assess RLS, payment security, Ghana data protection/consumer obligations and operational controls.

## Final walkthrough record

| Check | Result |
|---|---|
| Final `npm.cmd run lint` | Passed |
| Final `npm.cmd run build` | Passed |
| Public route and protected-route smoke | Passed |
| Supabase Auth and Client/Provider/Inspector/Admin access | Blocked: staging project/config unavailable |
| Request, assignment, reassignment, appeal and policy workflows | Blocked: service methods not implemented |
| Gateway checkout and payout onboarding | Blocked: gateway not selected/configured |
| RLS negative tests and webhook replay/reconciliation | Blocked: staging schema and gateway unavailable |
| `docs/backend/` included while other docs excluded | Passed: `git check-ignore` confirms backend docs are allowed and other docs are excluded |

## Readiness decision

This is a **frontend/backend-contract handoff**, not a finished backend integration and not a production release. Do not open the service to real users until the blockers above are implemented, tested in a staging Supabase project and reviewed.


## 5 November 2026: launch-service and credential update

| Finding | Product / security impact | Resolution and backend handoff |
|---|---|---|
| Public catalog, profile setup, request routes, and search still exposed the retired marketplace catalog. | Users could request unsupported jobs; matching would use inconsistent category names. | Introduced canonical four-category/seven-service catalog with stable IDs, active-only search, service-level Provider/Inspector selection, and construction scope lookup. Existing requests keep their stored service-name snapshots. Backend must seed `service_categories`, `services`, `construction_work_types`, and profile service relations as detailed in the guide. |
| Client requests had no optional verified-credential preference or construction work-type contract. | The Admin could not prioritize relevant verified credentials and construction requests lacked scope detail. | Added an unchecked, best-effort preference, stable service ID, construction scope ID/label, and form validation. Preference must never block assignment. |
| Provider and Inspector credential entry was free text and file selection only recorded a filename while implying upload/review. | False verification confidence and private-document handling risks. | Replaced with structured credential type/service/issuer/level/number/year/expiry fields, explicit optionality, status badges, and a workflow-service upload boundary. Upload and lookup are intentionally unavailable until secure Supabase services exist; the UI says files are not uploaded in this state. Never trust a browser-supplied verified status. |
| Admin credential decisions had no reason requirement or evidence-link contract. | Review decisions lacked an auditable rationale and UI suggested storage was already secure. | Added required decision notes and private evidence-link boundary; service methods remain fail-closed until backend functions, RLS and private Storage are ready. |
| Client help and landing copy described unsupported services and guarantees. | Public claims contradicted the managed workflow and launch scope. | Updated public service list, workflow FAQs and unsupported guarantee claims to the current request, assignment, bill and optional review flow. |
| Assigned Client case needs a safe credential trust signal. | Exposing full Provider profiles or certificate evidence would violate the approved visibility rule. | Added a Client-only, service-linked projection for a current verified title and a “Verified by LUCID” badge. Backend must return only that projection for the assigned Provider; no documents/numbers or directory data. |

Verification for this update: `node --test tests/catalog/*.test.js` passes (11 tests); `npm.cmd run lint` passes; `npm.cmd run build` passes. Public browser walkthrough at 390px verified the four-category catalog, no horizontal overflow, and electrician autocomplete navigation to the correct detail route; browser console had no errors. Authenticated request/profile/Admin flows could not be exercised because there is no connected Supabase staging environment or test accounts. Credential type labels are frontend options and require authoritative review; credential upload, signed evidence access, review decisions, profile persistence, and candidate credential data remain backend blockers. No remote Supabase schema was changed. The production build reports a large-chunk advisory.

## 6 November 2026: repository handoff update

The root README was rewritten to give new contributors the current product scope, setup requirements, route/build commands, source map, authentication boundary, backend limitations, and deployment paths. It no longer directs contributors to local-only development artifacts. The launch service list is documented as four categories and seven service types. `docs/backend/` is the only documentation subtree intentionally included for implementation handoff; other working documents remain excluded by `.gitignore`.
