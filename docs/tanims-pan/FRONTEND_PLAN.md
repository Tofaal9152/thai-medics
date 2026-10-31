# Frontend Development Plan

## Technology Stack

| Area | Technology |
| --- | --- |
| Template | `vite_tanstack` |
| Framework | React + TypeScript + Vite |
| Styling and UI | Tailwind CSS + shadcn/ui (Base UI) |
| Icons | Lucide React |
| Routing | TanStack Router |
| Server data | TanStack Query |
| API handling | Axios |
| Forms and validation | TanStack Form + Zod |
| Tables | TanStack Table |
| UI state | React state + Context |
| Excel export | SheetJS (`xlsx`) |
| Code quality | TypeScript + ESLint + Prettier |

## Routes and Related Content Plan

| Route | Section | Content | Functions and Features |
| --- | --- | --- | --- |
| `/` | Dashboard | Active cases, stage counts, follow-ups, appointments, financial summaries and recent activity | Create/open cases, search/filter, complete/reopen tasks, switch currency and open calendar |
| `/login` | Login page | Email and password fields | Sign in with email and password; sign out |
| `/workspace/patients` | Patient cases | Patient names, case IDs, contacts, hospitals, stages, sources, coordinators and office | Create cases, search/filter/sort, check duplicates, open cases and export CSV/Excel |
| `/patients/:caseId` | Patient workspace | Case header and eight tabs: Overview, Medical records, Communication, Hospital & appointment, Visa, Thailand assistance, Follow-up tasks, Accounts & billing | Edit details, move stages, record lost reasons, upload/view files, add notes/tasks, update appointments/travel and manage linked billing |
| `/workspace/calendar` | Follow-up calendar | Month/list views of tasks, appointments, arrivals and departures | Browse dates, select Today, filter by office/Mine, add tasks, complete/reopen tasks and open cases |
| `/workspace/accounts` | Accounts & billing | Patient accounts, charges, payments, balances, supplier costs, profit and financial documents | Select a case/currency, calculate charges and FX, save quotations, issue/lock invoices, record payments/refunds, reverse entries and print/save PDF |
| `/workspace/leads` | Lead & inquiry hub | Inquiry contacts, sources, assigned coordinators, response times, status and lost reasons | Add/edit inquiries, create/link cases, check duplicate phones, record lost reasons and export records |
| `/workspace/visas` | Medical visa desk | Patient/attendant records, passports, expiry dates, checklists, submissions and visa status | Add/edit linked records, tick document checklists, update status and flag passport expiry |
| `/workspace/messages` | Messaging & reminders | Bangla/English templates, recipients, message bodies, schedules and delivery status | Compose messages, select single/group/broadcast audiences, save reminders and simulate delivery into case history |
| `/workspace/hospitals` | Hospital directory | Departments, accreditation, location, contacts, price validity, linked packages, doctors and reply history | Add/edit hospitals, update partner information, search/filter and export records |
| `/workspace/doctors` | Doctor management | Hospital, specialty, languages, clinic days, outcomes and assigned patients | Add/edit profiles, search specialists, open linked cases and record demo second-opinion requests |
| `/workspace/agents` | Agent network | Contacts, districts, terms, referrals, rankings, commissions and monthly statements | Add/edit agents, configure fixed/percentage rules and hospital/package scope, review referrals, record demo payouts and export statements |
| `/workspace/packages` | Packages & quote comparison | Package estimates/validity and side-by-side hospital replies with doctors and reply times | Add/edit packages, record hospital requests/replies, select a proposal and save its quotation with financial permission |
| `/workspace/suppliers` | Suppliers & vendors | Vendor categories, contacts, negotiated rates, contract validity, balances and linked bookings | Add/edit suppliers, search/filter, review currency-separated costs/payments and export records |
| `/workspace/ground` | Thailand ground services | Patient-linked pickups, transfers, interpreters, dates/times, suppliers, locations and emergency/on-call contacts | Add/edit bookings, assign providers, update service status and export schedules |
| `/workspace/aftercare` | Aftercare & feedback | Return dates, consultations, medication reminders, next visits, ratings and feedback | Add/edit plans, create 1-week/1-month/3-month check-in tasks, record feedback and update status |
| `/workspace/reports` | Reports & analytics | Inquiry/conversion counts, stage/source breakdowns, lost reasons, response times, workload and revenue/profit | Select month/currency, group financial results by hospital/agent/package/staff and export Excel |
| `/workspace/staff` | Staff & permissions | Staff contacts, positions, offices, roles, status and permission matrix | Add/edit/invite/approve staff, deactivate/reactivate, apply role templates/custom permissions and warn about active-case reassignment |
| `/workspace/settings` | System information & settings | Company contacts/address, default account currency, document footer, feature information and demo reset | Update billing settings, review capabilities and restore demo records with confirmation |
| `/patient-portal` | Patient & family portal | Own case progress, appointment, visa status, documents, billing and aftercare | View linked information, upload permitted files, view financial documents, simulate payment and submit feedback |
| `/agent-portal` | Agent portal | Own referrals, patient stages, commissions and monthly statements | Submit referrals, track linked cases, choose statement month and download statements |
| `/inquiry` | Public inquiry form | Patient name, phone, email, city and stated medical need | Validate/submit inquiry, create or link a patient case and show confirmation |
