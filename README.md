# Thai Medical Desk

Full frontend demonstration of the Thai Medics workspace, built with the selected Vite, React, TypeScript and TanStack template. Includes fictional data and browser-local interactions across the staff, patient/family and agent experiences.

## Start the website

Run these commands from this project folder:

```sh
bun install
bun run dev
```

Open **http://127.0.0.1:5174**. This project uses port **5174** so it does not conflict with the original template on port 5173. If 5174 is already running, open its existing preview or stop that process before starting another copy.

The dashboard opens as a demo administrator. Use the **Admin** button at the top to switch personas. Login screens accept any demo password; the verification/OTP code is **123456**, shown on screen. Patient and agent login forms show fictional account details.

## Pages and demo features

| Area | Included |
| --- | --- |
| Dashboard | 32 patient cases, nine journey stages, office/stage/owner filters, follow-ups, appointments, financial summaries |
| Patient cases | Search, create/edit, duplicate warnings, lost reasons, stage changes, Excel/CSV export |
| Case workspace | Overview, medical/travel files, communication notes, appointments, visa checklists, Thailand arrangements, handovers, tasks and billing |
| Calendar | Month/list views, assigned tasks, appointments, arrivals/departures, completion/reopening |
| Accounts | Visa, air, hotel, land and service charges; discounts; manual FX; quotations, invoices, receipts and statements; draft editing, locking, reversals and supplier settlement tracking |
| Hospital and doctor directories | Profiles, contacts, price lists, validity, reply history, assigned patients and demo second-opinion requests |
| Agents | Referrals, performance ranking, scoped commission terms, monthly statements and demo payout tracking |
| Lead hub | Source tracking, automatic case linking for website/Facebook/phone intake, follow-ups, lost reasons |
| Messaging | Bangla/English templates, scheduled reminder records and simulated individual/group/broadcast delivery |
| Packages | Hospital requests, side-by-side replies, proposal selection and Accounts quotation handoff |
| Suppliers and Thailand services | Vendor rates/contracts, balances, case-linked transfers, interpreters and service bookings |
| Aftercare | Return plans, 1-week/1-month/3-month check-in tasks, consultation links and feedback |
| Staff and management | Invitations, role templates, custom permission matrix, audit history, monthly analytics, billing settings and demo reset |
| Patient/family portal | Linked case progress, appointments, visa status, document uploads, patient financial documents, demo payment interface and feedback |
| Agent portal | Own referrals, lead submission, stages, commissions and monthly statement downloads |
| Public inquiry | Patient inquiry form linked to the case workflow |

Main routes: `/`, `/workspace/patients`, `/workspace/calendar`, `/workspace/accounts`, `/workspace/hospitals`, `/workspace/doctors`, `/workspace/agents`, `/workspace/visas`, `/workspace/leads`, `/workspace/messages`, `/workspace/packages`, `/workspace/suppliers`, `/workspace/ground`, `/workspace/aftercare`, `/workspace/reports`, `/workspace/staff`, `/workspace/audit`, `/workspace/settings`, `/login`, `/patient-portal`, `/agent-portal`, `/inquiry` and `/patients/<case-id>`.

## Demo behavior

Changes persist in this browser's local storage. Uploaded fictional PDF/JPG/PNG files (up to 10 MB each) persist in IndexedDB. Sample attachment rows contain metadata only; upload a fictional file to try the viewer and download. Use **System & settings → Reset demo data** to restore seeded records.

BDT, THB and USD totals stay separate. Agent statements use invoice month; completion-triggered terms become eligible when a case completes. Print financial documents using **Print / Save PDF** and choose the browser's PDF destination.

This is a frontend demo. Authentication, OTP, permissions, hospital report sharing, message delivery and online payments are simulated. Browser role checks are UI demonstrations; a production backend must enforce access and financial rules. No live services or real transactions are connected. Use fictional patient data only.

## Validation

```sh
bun run typecheck
bun run lint
bun test
bun run build
```

The tests cover billing calculations, decimal/FX precision, locking and reversal rules using isolated in-memory fixtures, storage validation, route rendering and portal/role separation.

The frontend code is in `src/features/dashboard/` and `src/features/workspace/`; route files live in `src/routes/_public/`. Product documents and the frontend plan remain in `docs/tanims-pan/`.
