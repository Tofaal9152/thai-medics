# Thai Medical Desk Frontend Development Plan

**Scope:** Build the full website frontend, including all staff modules, the patient/family portal and the agent portal. All sections below are in scope, without MVP or phase-based exclusions.

## 1. Tech Stack

Use the selected `vite_tanstack` template already copied into this project.

| Area | Technology |
| --- | --- |
| Framework | React + TypeScript + Vite |
| Styling and components | Tailwind CSS + shadcn/ui with Base UI |
| Icons | Lucide React |
| Routing | TanStack Router with file-based routes |
| Server data | TanStack Query |
| UI/session state | React state, Context and the template's existing auth store |
| API handling | Axios through the template's shared HTTP layer |
| Forms and validation | TanStack Form + Zod |
| Tables | TanStack Table |
| Languages | Bangla and English; add react-i18next and use `Intl` formatting |
| Fonts | Bundled Inter plus a Bengali-capable font |
| Code quality | TypeScript checks, ESLint and Prettier |

## 2. Pages, Sections, Functions and Features

### Main Pages and Shared Layout

| Page / Section | What It Shows | Functions and Features |
| --- | --- | --- |
| Login and account access | Login form, invitation/account status and language selector | Staff sign-in, sign-out, invitation acceptance and two-factor login UI; patient phone OTP; agent sign-in |
| Shared layout | Branding, sidebar, header, current user/office and language switch | Page navigation, active-page indicator, role-based menus and responsive mobile navigation |
| Dashboard | Active cases, today's follow-ups, overdue tasks, upcoming appointments, stage counts and authorised financial summaries | Create/open a case, search/filter patients, click stage counts, complete/reopen tasks and open the calendar |
| Patient cases | Case ID, name, phone, hospital, stage, source and assigned coordinators | Create/edit cases; search by name, ID, phone or hospital; filter by stage, coordinator and office; warn about duplicate phone/passport; record lost leads with reasons; export to Excel |
| Follow-up calendar | Month/list views of tasks, appointments, arrivals and departures | Browse dates, select Today, filter Mine only, create assigned tasks, complete/reopen tasks and open linked cases; show overdue, today, upcoming and completed items |
| Staff and permissions | Staff ID, name, position, contacts, office, status, role and permission matrix | Add/edit/invite/approve staff; deactivate/reactivate; assign Admin, Manager, Accounts, Coordinator, View-only or Custom permissions; warn when cases need reassignment |
| Audit history | Date/time, staff member, action and affected record | View case, document, financial and permission activity |
| System information | Feature status, setup/help information and bilingual user guidance | Explain system capabilities; reset fictional data in demo mode |

### Patient Case Workspace

**Case stages:** New Inquiry → Reports Collection → Hospital Review → Appointment Confirmed → Visa → Travel Arrangements → Treatment → Follow-up → Completed. A case can also be marked **Lost lead**, with a reason.

| Section / Tab | What It Shows | Functions and Features |
| --- | --- | --- |
| Case header | Case ID, patient name, current stage, office and creation details | Move forward/back through stages; display progress; close a lost lead with a reason |
| Overview | Contacts, age/gender, city, stated medical need, companion, source/agent and BD/TH coordinators | Edit patient details, assign coordinators and link referral information |
| Medical records | Reports, prescriptions, quotations, treatment plans, passport/travel documents, document dates and uploader | Upload multiple PDF/JPG/PNG files, up to 10 MB each; categorise, view and download permitted files |
| Communication | Calls, WhatsApp, email and in-person notes with author, time, outcome and next action | Add permanent notes; create a task from the next-action date; send templates and save messages to the case |
| Hospital and appointment | Selected hospital/doctor, department, appointment, report submission/reply dates, proposal status and attachments | Select directory records, track replies and waiting days, record proposal acceptance/decline and attach quotations/plans |
| Visa | Patient/attendant documents, letters, passport expiry, embassy submission and visa status | Maintain checklists, flag missing documents and show expiry/appointment reminders |
| Thailand assistance | Flights, arrival/departure, accommodation, transfers, interpreter, special needs and handover notes | Assign TH coordinator, update arrangements, mark services pending/arranged/not needed and add office handovers |
| Follow-up tasks | Task, owner, due date, status and completion details | Create, assign, complete and reopen tasks; highlight overdue/today items |
| Accounts and billing | Patient charges, payments, documents, balance, supplier costs and internal profit | Open the case-linked account; restrict viewing/editing by permission |

### Accounts and Billing

| Section | What It Shows | Functions and Features |
| --- | --- | --- |
| Accounts overview | Patient accounts, balances/credits, supplier balances and internal profit | Find an account by case ID, open details and show separate BDT/THB/USD totals |
| Visa fees | Visa category, travellers, fee and service charge | Calculate travellers × unit fee + service charge |
| Air-ticket fees | Passenger, airline, route, dates, ticket reference, charge and service fee | Calculate ticket charge + service fee |
| Hotel charges | Hotel, check-in/out, rooms and nightly rate | Calculate rooms × nights × rate; validate dates |
| Land packages | Transfers, interpreter/other services, quantity, rate and hotel-included flag | Calculate quantity × rate; warn about double billing when hotel is also charged separately |
| Service charges and discounts | Description and amount | Add agreed service charges and subtract discounts |
| Currency and totals | Invoice currency, original entry amount/currency, manual exchange rate and converted amount | Keep one invoice currency per case; show conversion preview; prevent currency changes after entries exist; separate draft/invoiced profit |
| Charges and financial documents | Draft/issued charges, quotations, invoices, receipts and statements | Edit/delete drafts; number quotations only on save; issue/lock invoices; correct posted entries by reversal with a reason; preview, print/save PDF |
| Payments and refunds | Amount, date, method, reference, receipt and balance/credit | Record cash, bank, bKash/Nagad, card or cheque; record refunds; generate receipts; show invoice payment links |
| Supplier accounts | Supplier costs, payments, outstanding balances and internal profit | Record costs/payments, lock paid costs and reverse corrections; keep internal figures off patient documents |
| Billing settings | Company details, default currency and document footer | Edit the information printed on financial documents |

**Payment clarification:** include the online-payment interface in the full frontend scope. Confirm the payment provider and final integration behavior before connecting live payments.

### Business Modules and Portals

| Page / Section | What It Shows | Functions and Features |
| --- | --- | --- |
| Hospital directory | Hospitals, departments, accreditation, location, contacts, package prices/validity and reply history | Maintain hospital records, select hospitals in cases and access partner prices/contacts |
| Doctor management | Specialty, hospital, languages, clinic days, treated patients and outcomes | Maintain profiles, select specialists using the patient's stated need and request second opinions |
| Agent network | Agent contacts/district, terms, referrals, commission and performance | Link cases to agents; calculate fixed/percentage commission by agreed rules; track earned/pending/paid amounts, payouts, rankings and monthly statements |
| Agent portal | Own referrals, case stages, commissions and statements | Submit patient leads from a phone, track only own referrals and download monthly statements |
| Medical visa desk | Patient/attendant checklists, appointment/invitation letters, passport expiry and embassy status | Manage linked visa records, track submissions/decisions and show document/date alerts |
| Lead and inquiry hub | Website/Facebook/phone inquiries, sources, coordinators, response times and lost reasons | Create cases from inquiries, assign follow-ups, warn about duplicate phone/passport and record lost leads |
| Public inquiry form | Patient contact details and stated medical need | Submit an inquiry into the case workflow |
| Messaging and reminders | Bangla/English templates, case message history and reminder schedules | Send/save WhatsApp/email messages; remind about documents, payments, flights and appointments; send health-camp/offer broadcasts |
| Packages and quote comparison | Treatment packages, hospital replies, estimates, doctors and reply times | Send reports to several hospitals, compare quotes side by side and turn the selected reply into the patient proposal/quotation |
| Supplier and vendor hub | Hotels, apartments, airlines, transport, interpreters, negotiated rates and contract validity | Maintain vendors/rates, link bookings to cases and review supplier payments/balances |
| Patient and family portal | Current stage, appointment, visa status, reports/passports, invoices and receipts | Phone-OTP access, permitted uploads, status tracking, financial-document viewing and the agreed payment interface |
| Thailand ground services | Pickup/transfer rosters, interpreter assignments, daily schedules, emergency contacts and on-call staff | Schedule services and link arrangements to patient cases |
| Aftercare and feedback | Return dates, follow-up consultations, reminders and hospital/staff ratings | Schedule check-ins at 1 week, 1 month and 3 months; coordinate video follow-ups; record medication/next-visit reminders and feedback |
| Reports and analytics | Monthly inquiries, conversion, lost reasons, revenue/profit by hospital/agent/package/staff, workload and response times | Review performance, filter reports and export lists/reports to Excel |

### Features Across the Website

- Responsive desktop/mobile layouts and Bangla/English interface.
- Role-based screens/actions; patients and agents see only their permitted records.
- Shared navigation, cards, tables, filters, forms, modals, upload controls, status badges and calendar components.
- Form validation, loading/empty/error states and clear save/update feedback.
- One linked patient case across records, appointments, visas, services, tasks and billing.
