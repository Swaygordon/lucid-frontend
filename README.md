# LUCID Frontend

LUCID is a React web application for finding local services and coordinating work through LUCID staff and field Inspectors. This repository contains the public website, service catalog, authentication screens, and role-based Client, Service Provider, Inspector, and Admin workspaces. The UI and Supabase authentication boundary are present; most case, messaging, credential, financial, notification, and policy operations still need backend implementation. See the [Supabase implementation guide](docs/backend/BACKEND_WORKFLOW_IMPLEMENTATION_GUIDE.md) and [handoff audit and fix log](docs/backend/HANDOFF_AUDIT_AND_FIX_LOG.md).

## Run locally

Requirements: Node.js and npm. From the repository root:

```sh
npm ci
npm run dev
```

Public pages can be opened without Supabase configuration. Authenticated pages require a Supabase project. For local development, create an ignored `.env.development.local` file in the repository root:

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

Only use the publishable/anon key in browser code. Never add a Supabase service-role key, payment secret, or other server credential to this repository or a `VITE_` variable. The service-role key and payment-provider secrets belong in trusted server or Edge Function configuration.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Create the production bundle in `dist/`. |
| `npm run preview` | Serve the most recent production bundle locally. |
| `npm run lint` | Run ESLint across the repository. |
| `npm run deploy` | Publish `dist/` through `gh-pages` (deployment access required). |

There is currently no general workflow test script in `package.json`. The backend handoff guide defines the required database, authorization, payment, and browser test coverage.

## Product and workflow scope

The launch catalog contains four categories and seven services:

- **Home Repairs & Maintenance:** Plumber, Electrician, Carpenter, Handyman
- **Auto Repairs:** Auto mechanic
- **Cleaning Services:** Cleaner
- **Construction & Renovation:** Construction worker, with a construction work-type selection on the request

Clients browse or search the public catalog and submit a service request. LUCID Admin/HR clarifies and may update request details, then assigns an Inspector based on suitability and location. If no Inspector is available, the Client can consent once to proceed without one; Admin can then assign a Provider, who assesses the site and starts the work without another Client step. After completing the work, the Provider submits a final bill. The Client accepts and pays through gateway checkout or rejects the bill with an optional note so the Provider can revise it. Reviews are optional. Clients do not browse Provider profiles or receive Providers' direct contact details.

Sign-in uses email and password; the server determines the account role. Public registration is for Clients, Providers, and Inspectors. Admin access is provisioned by IT and must not be self-registered. Provider and Inspector payout setup must use a payment provider's secure onboarding. Client request submission does not collect payment credentials.

## Current backend boundary

`src/contexts/WorkflowModeContext.jsx` connects Supabase Auth sign-in, sign-up, session restoration, and role resolution. Role resolution reads the user's `profiles` row and active `lucid_staff_memberships`; production signup must provision roles through a trusted backend process, and Admin membership must remain IT-controlled.

`src/services/workflow/liveWorkflowService.js` is the UI-to-workflow service boundary. A few reads use Supabase tables, but many writes and integrations deliberately return `BACKEND_OPERATION_NOT_IMPLEMENTED`. This includes request creation and transitions, assignment search/actions, most messaging, profile and credential writes, financial records, payment/payout integration, notifications, appeals, and policy operations. Do not treat a rendered page or local UI state as proof of persistence or authorization. The SQL files in `supabase/migrations/` are historical drafts; review and reconcile them against the implementation guide and the target Supabase project before applying any migration.

This repository is a frontend/backend handoff, not a live service ready for production users. Server-enforced role authorization, RLS, audited workflow transitions, payment gateway and webhook integration, payout onboarding, operational notifications, and staging verification remain required.

## Repository map

- `src/app/App.jsx` — application providers, routes, role guards, and redirects.
- `src/app/layout/` — public and authenticated workspace shells and shared gates.
- `src/pages/` — public, authentication, account, and role workspace pages.
- `src/components/shared/` — components reused across page areas; `src/components/ui/` — interface primitives; other component folders are organized by feature.
- `src/data/catalog/` — launch services, categories, work types, and credential options.
- `src/services/` — Supabase client and frontend service boundaries.
- `src/contexts/`, `src/hooks/`, and `src/utils/` — shared state, hooks, and helpers.
- `src/assets/` — brand, catalog, home carousel, location, and workflow illustration assets.
- `supabase/migrations/` — historical schema drafts that require review; not approved production migrations.
- `docs/backend/` — handoff documentation intentionally included for backend implementation. Other working documentation and local-only artifacts are excluded by `.gitignore`.

## Deployment paths

Vite uses `/lucid/` for local development and `/lucid-frontend/` for GitHub Pages. Routes are declared in `src/app/App.jsx`. When changing routes or deployment configuration, keep `vite.config.js`, the router basename, URL helpers, links, and GitHub Pages fallback behavior aligned.
