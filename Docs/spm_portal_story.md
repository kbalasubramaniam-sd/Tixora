# Tixora — Product Story & Workflow Specification
**Tixora | Powering Every Request**
*Strategic Partner Management | Internal Operations Portal*
*Version 1.4 | April 2026*

---

## The Problem We're Solving

Every day, teams managing partner-facing operations across Rabet, Rhoon, Wtheeq, and Mulem lose time to the same invisible tax: chasing approvals by email, re-explaining context that was already provided, discovering missing documents only after a ticket has sat unactioned for two days, and having no single source of truth when a partner asks *"where does my request stand?"*

There is no consistent routing. There is no enforced completeness. There is no audit trail that survives a team member's departure. There is no SLA visibility until a breach has already happened.

SPM exists to eliminate that tax entirely.

---

## The Vision

> **SPM is the single operational gateway through which every partner-facing request — across all four platforms — is raised, routed, reviewed, approved, and fulfilled. Zero ambiguity about who owns it, what is needed, or what happens next.**

Every request in SPM is anchored to a **Product** and a **Task**. That combination unlocks a pre-defined workflow matrix — a deterministic path that knows who to notify, what to collect, where to route, and when to escalate. No one decides the process in the moment. The system decides it, every time, consistently.

---

## Who Uses SPM

> **SPM is a fully internal portal.** All users are employees of the organisation. Partners (insurance companies, banks, financing entities) are external entities whose onboarding and servicing is managed through SPM, but partners never access or see the portal. All references to "partner contact" in notifications and workflows refer to the internal relationship owner assigned to that partner.

| Persona | Role in SPM |
|---|---|
| **Requester** | Internal employee who raises a request on behalf of a partner or internal team |
| **Reviewer** | First-line validator — checks completeness and eligibility |
| **Approver** | Authorises progression past a defined gate |
| **Integration Team** | Owns UAT lifecycle and API provisioning steps |
| **Provisioning Agent** | Executes fulfilment tasks (account creation, access grants, resets) |
| **System Administrator** | Manages workflow configurations, SLA rules, and user access |

---

## The Product Catalogue

SPM operates across four products. Every request must be pinned to exactly one.

---

### Rabet
**Platform for the Federal Authority for Identity, Citizenship, Customs & Port Security (ICP)**

Rabet is a digital platform that enables the real-time transfer of health insurance data from over 43 insurance companies directly into the ICP system. Partners onboarded to Rabet are insurance entities whose data flows feed identity and residency-linked health coverage records maintained by ICP.

- **Regulatory context:** ICP-mandated data exchange; agreement sign-off carries compliance implications
- **Partner type:** Insurance companies (43+ active)
- **Integration sensitivity:** High — real-time data transfer to a federal authority system
- **Portal type:** Transactional
- **Access type:** Both (Portal + API)
- **Product code:** `RBT`

---

### Rhoon
**Platform for Abu Dhabi Police (ADP) and Integrated Transport Centre (ITC)**

Rhoon is a digital platform that enables mortgage-related transactions for over 180 financing entities — including banks — connecting them to both ADP and ITC. It automates mortgage-linked services across Abu Dhabi and the Northern Emirates, digitising a process that previously required manual intervention across multiple government and financial touchpoints.

- **Regulatory context:** Dual-authority platform (ADP + ITC); partner agreements must reflect both authority scopes
- **Partner type:** Banks and financing entities (180+ active)
- **Integration sensitivity:** High — live transactional data to government authorities
- **Portal type:** Transactional
- **Access type:** Both (Portal + API)
- **Product code:** `RHN`

---

### Wtheeq
**Platform for Abu Dhabi Police (ADP) and Integrated Transport Centre (ITC)**

Wtheeq is an electronic platform that facilitates the seamless transfer of vehicle insurance data from over 38 insurance companies to ADP and ITC systems. It streamlines insurance verification services and maintains a unified vehicle insurance database across Abu Dhabi and the Northern Emirates.

- **Regulatory context:** Shared authority scope with Rhoon (ADP + ITC) but distinct data domain (vehicle insurance vs. mortgage)
- **Partner type:** Insurance companies (38+ active)
- **Integration sensitivity:** High — feeds unified government vehicle database
- **Portal type:** Read-only
- **Access type:** API
- **Product code:** `WTQ`

---

### Mulem
**Unified Motor Insurance Data Platform**

Mulem is a unified data platform that enables insurers to digitally price, quote, and issue motor insurance policies by automatically retrieving complete, verified driver, vehicle, and accident history data directly from official government systems. It removes manual data collection from the underwriting process, replacing it with a single, authoritative data pull.

- **Regulatory context:** Government-sourced data; partner access is conditional on agreement validation and credential security
- **Partner type:** Insurance companies (motor underwriting)
- **Integration sensitivity:** High — direct API access to government-held personal and vehicle data
- **Portal type:** Read-only
- **Access type:** API
- **Product code:** `MLM`

---

## The Task Library

Four task types are supported across all products. Each carries its own form schema, routing rules, SLA targets, document requirements, and notification triggers.

---

### T-01 · Agreement Validation and Sign-off

**Purpose:** Validate agreement details and complete the internal sign-off process before any onboarding, access provisioning, or system setup activity begins. No downstream task (UAT access, account creation, etc.) may be initiated for a partner without a completed agreement on record.

**Key workflow notes:**
- Requester captures full agreement details: partner name, product, scope, effective date, commercial terms, and signatory information. Agreements are auto-renewed and do not carry an expiry date
- Supporting documentation package is mandatory at submission: agreement copy, Term Letter (TL), VAT Certificate, Power of Attorney (POA), and any product-specific addenda
- Internal review and validation is conducted by the **Legal team** and **Product team** in sequence
- Final sign-off requires confirmation from **Legal**, **Product team**, and the **Enterprise Authority (EA)**
- Upon completion, all relevant stakeholders — including the requesting team and partner relationship owner — are notified automatically
- A completed agreement record is created in SPM and referenced by all subsequent requests for that partner

**Routing path:** Requester → Legal Review → Product Review → EA Sign-off → Completed

---

### T-02 · UAT Access Creation

**Purpose:** Raise and fulfil a request for UAT environment access for a named partner contact on the selected product.

**Key workflow notes:**
- Ticket captures: partner name, product, UAT environment details, named user(s), access type and permissions scope
- Ownership and routing is determined by the selected product — each product's UAT environment is managed by its aligned internal team
- Final ownership rests with the **Integration team**, who manage two distinct closure phases:
  - **Phase 1 — Access Provisioned:** Upon creation of UAT access, the system notifies all relevant stakeholders (requester, partner contact, internal owners) confirming that UAT access is live
  - **Phase 2 — UAT Completed:** Upon the partner's successful completion of UAT testing, the Integration team formally reviews and approves the UAT submissions, then closes the ticket with documented confirmation of UAT sign-off
- The ticket remains open between Phase 1 and Phase 2; SLA tracking covers both phases independently

**Routing path:** Requester → Product Team Review → Integration Team (Phase 1: Access) → Integration Team (Phase 2: UAT Sign-off) → Completed

---

### T-03 · Production Account Creation *(with API opt-in)*

**Purpose:** Create production accounts for the partner — including both the partner account and all required user accounts — on the selected product. Every partner receives portal access by default. At submission, the requester declares whether the partner also requires API integration. When API is opted in, both portal and API provisioning paths execute in parallel after approval — ensuring complete access without sequential delays.

**Workflow split:**

**Portal Journey (default):**
- Collation of required partner account details, admin user details (full name, designation, email address, access role, and any product-specific user parameters), and any additional user accounts to be created
- Access provisioning steps against the portal environment, including partner account creation and all specified user accounts
- Portal enablement confirmation and notification to requester and partner

**API Journey (triggered by opt-in):**
- Collation of required account and technical integration details
- IP whitelisting configuration
- Credential issuance (API keys, certificates, or equivalent)
- Technical confirmation to integration contact and requester

**Opt-in mechanism:**
- A clearly labelled toggle at the start of the T-03 form: *"Does this partner require API access?"*
- When toggled **ON**: API-specific fields are revealed and become mandatory. Portal fields remain collected. The workflow routes through **both** the Provisioning Team (portal setup) **and** the Integration Team (API provisioning) in parallel after approval.
- When toggled **OFF**: only the portal journey fields are collected; workflow routes to Provisioning Team only.
- The opt-in status is stamped on the ticket at submission and cannot be changed without raising a new request.

**Routing path (Portal only):** Requester → Partner Ops Review → Partner Director Approval → Provisioning Team → Completed

**Routing path (Portal + API):** Requester → Partner Ops Review → Partner Director Approval → Provisioning Team (Portal Setup + User Creation) + Integration Team (IP Whitelisting + Credential Issuance) [parallel] → Both confirmed → Completed

---

### T-04 · Access & Credential Support

**Purpose:** Resolve access and credential issues for a named partner user — covering portal login problems (password reset, account unlock) or API credential issues (key regeneration, certificate renewal) depending on the product's access type.

**Key workflow notes:**
- Identity verification and validation checks are performed before any action is taken — the ticket must confirm the requestor is authorised to raise a support request on behalf of the named user
- The requester selects an **issue type** from a dropdown driven by the product's access type:
  - **Both (Portal + API) products (Rabet, Rhoon):** Portal login issue (password reset, account unlock) | API credential issue (key regeneration, certificate renewal)
  - **API products (Wtheeq, Mulem):** Read-only portal password reset | API credential issue (key regeneration, certificate renewal)
- Provisioning team resolves the issue
- Confirmation notification is sent to the requester once the issue is resolved

**Routing path:** Requester → Provisioning Team (Verification + Resolution) → Completed

---

## The Workflow Matrix

The combination of **Product × Task** determines the exact workflow path. SLA targets below are indicative and should be confirmed against operational commitments.

```
┌──────────────────────────────────┬─────────────────────────┬──────────────────────┬────────────────────────────────┬───────────┐
│ Task                             │ Review Stage(s)         │ Approval Stage       │ Provisioning / Closure         │ SLA (hrs) │
├──────────────────────────────────┼─────────────────────────┼──────────────────────┼────────────────────────────────┼───────────┤
│ T-01 Agreement Validation        │ Legal Team →            │ Legal + Product      │ EA Sign-off →                  │ 48        │
│       & Sign-off                 │ Product Team            │ Team                 │ Stakeholder Notification       │           │
├──────────────────────────────────┼─────────────────────────┼──────────────────────┼────────────────────────────────┼───────────┤
│ T-02 UAT Access Creation         │ Product Team            │ —                    │ Integration Team               │ 8 (Ph 1)  │
│                                  │                         │                      │ Ph 1: Access Provisioned       │ TBD (Ph 2)│
│                                  │                         │                      │ Ph 2: UAT Sign-off & Close     │           │
├──────────────────────────────────┼─────────────────────────┼──────────────────────┼────────────────────────────────┼───────────┤
│ T-03 Production Account Creation │ Partner Ops             │ Partner Director     │ Provisioning Team (Portal +    │ 24        │
│       — Portal path              │                         │                      │ User Creation)                 │           │
├──────────────────────────────────┼─────────────────────────┼──────────────────────┼────────────────────────────────┼───────────┤
│ T-03 Production Account Creation │ Partner Ops             │ Partner Director     │ Provisioning (Portal + Users) +│ 48        │
│       — Portal + API path        │                         │                      │ Integration (API) [parallel]   │           │
├──────────────────────────────────┼─────────────────────────┼──────────────────────┼────────────────────────────────┼───────────┤
│ T-04 Access & Credential Support │ —                       │ —                    │ Provisioning Team              │ 2         │
│                                  │                         │                      │ (Verify + Resolve + Confirm)   │           │
└──────────────────────────────────┴─────────────────────────┴──────────────────────┴────────────────────────────────┴───────────┘
```

*Product-specific routing overrides — e.g., Mulem API credential resets routed to Integration rather than Provisioning — are configurable by the System Administrator per Product × Task combination.*

> **SLA Note:** All SLA targets listed above are measured in **business hours** (Sunday–Thursday, 08:00–17:00 GST). SLA clocks do not run outside business hours or on public holidays. Business hour definitions are configurable by the System Administrator.

---

## Partner Lifecycle

Every partner on a given product progresses through a defined lifecycle. Each stage corresponds to a task type, and progression is enforced — a partner cannot advance to a later stage without completing the prior one.

```
┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
│  T-01 · Agreement   │ ───▶ │  T-02 · UAT Access  │ ───▶ │  T-03 · Production  │ ───▶ │       LIVE          │
│  Validation &       │      │  Creation            │      │  Account Creation   │      │                     │
│  Sign-off           │      │                      │      │                     │      │                     │
│                     │      │                      │      │                     │      │                     │
│  State: ONBOARDED   │      │  State: UAT ACTIVE   │      │  State: LIVE        │      │                     │
└─────────────────────┘      └─────────────────────┘      └─────────────────────┘      └─────────────────────┘
```

**Lifecycle:** None → [T-01] → Onboarded → [T-02] → UatActive → [T-03] → Live

| Lifecycle State | Entry Condition | Meaning |
|---|---|---|
| **ONBOARDED** | T-01 completed and signed off | Partner has a valid, approved agreement on record. Agreement is signed off and partner is ready for UAT. |
| **UAT ACTIVE** | T-02 Phase 1 completed (access provisioned) | Partner has UAT environment access and is actively testing. |
| **LIVE** | T-03 completed (production accounts and users created) | Partner has production accounts and active users; fully operational on the product. |

**Lifecycle rules:**
- T-02 cannot be raised unless the partner is in **ONBOARDED** state or later for the same product.
- T-03 cannot be raised unless the partner is in **UAT ACTIVE** state (T-02 Phase 2 signed off) for the same product.
- T-04 (Access & Credential Support) is available at any lifecycle state from **LIVE** onwards — it does not advance the lifecycle.
- A partner's lifecycle state is tracked per product. A partner onboarded to Rabet may be at a different lifecycle stage on Mulem.
- Agreements are **auto-renewed** and do not expire. Each product carries its own independent agreement — a partner operating across multiple products holds a separate T-01 agreement record per product.

---

## Ticket ID Convention

Every request generates a unique, structured ticket ID:

```
SPM-[PRODUCT CODE]-[TASK CODE]-[YYYYMMDD]-[SEQUENCE]
```

| Example | Meaning |
|---|---|
| `SPM-RBT-T01-20260401-0001` | Rabet · Agreement Validation · 1 Apr 2026 · First ticket of the day |
| `SPM-MLM-T03-20260401-0042` | Mulem · Production Account Creation · 1 Apr 2026 · 42nd ticket of the day |
| `SPM-WTQ-T04-20260401-0011` | Wtheeq · Access & Credential Support · 1 Apr 2026 · 11th ticket of the day |

---

## User Stories

---

### Epic 1 — Request Submission

---

**US-001 · Product & Task Selection**

> *As a Requester, I want to select a Product and then a Task so that the system activates the correct workflow matrix for my request.*

**Acceptance Criteria:**
- Submission begins with a mandatory Product selector: Rabet, Rhoon, Wtheeq, Mulem — each displayed with its description and product code.
- Task options render dynamically based on the selected Product.
- A Requester cannot proceed without both a Product and Task confirmed.
- The selected Product × Task combination is permanently stamped on the ticket and cannot be edited post-submission.

---

**US-002 · Guided, Task-Specific Form**

> *As a Requester, I want the form to show only the fields relevant to my selected Task so that I am never confused by irrelevant inputs.*

**Acceptance Criteria:**
- Each Task renders its own pre-configured field schema; no generic free-text submission is permitted.
- Conditional fields appear or hide based on prior answers (e.g., API opt-in fields in T-03 on "Both" products, issue type in T-04 based on the product's access type).
- Fields include contextual helper text explaining what is required and why.
- Form state is auto-saved as a draft every 60 seconds.

---

**US-003 · Mandatory Field and Document Enforcement**

> *As a Requester, I want the system to block submission if any mandatory field or required document is missing so that incomplete requests never enter the workflow.*

**Acceptance Criteria:**
- Each Task defines mandatory fields and required document types. For T-01, mandatory documents include: agreement copy, Term Letter, VAT Certificate, and POA.
- Submit button is disabled until all mandatory items are satisfied.
- Inline validation highlights incomplete fields in real time.
- A pre-submission summary screen presents all inputs and attachments for Requester review before final submission.
- Uploads enforce: PDF, DOCX, XLSX, PNG, JPG; max 10 MB per file.

---

**US-004 · Product-Driven Access Path for Production Account Creation (T-03)**

> *As a Requester raising a Production Account Creation request, I want the form and workflow to automatically adapt based on the selected product's access type so that the correct provisioning path is triggered without manual selection on API-only products.*

**Acceptance Criteria:**
- The T-03 form adapts based on the selected product's access type:
  - **API-only products (Wtheeq, Mulem):** No toggle is shown. API-specific fields are always rendered and mandatory. Workflow routes to Integration Team for IP whitelisting and credential issuance.
  - **Both products (Rabet, Rhoon):** A clearly labelled toggle is presented: *"Does this partner also require API access?"* Portal provisioning is always included.
    - **Toggle OFF (Portal only):** Portal-specific fields rendered; workflow routes to Provisioning Team.
    - **Toggle ON (Portal + API):** Additional mandatory fields revealed — API use case, expected call volume, technical contact name and email, IP addresses for whitelisting, preferred environment. Workflow routes to both Provisioning Team (portal) and Integration Team (API) in parallel.
- The access path (Portal only / Portal + API / API only) is displayed prominently on the ticket throughout its lifecycle.
- The access path cannot be changed post-submission; a new request must be raised if requirements change.

---

**US-005 · UAT Two-Phase Closure (T-02)**

> *As a member of the Integration team, I want the UAT ticket to support two distinct closure phases so that access provisioning and UAT sign-off are each formally recorded as separate events.*

**Acceptance Criteria:**
- The T-02 ticket has two defined Integration Team stages: **Phase 1 — Access Provisioned** and **Phase 2 — UAT Sign-off**.
- Phase 1 closure triggers automatic notification to: requester, partner contact, and internal owners confirming UAT access is live.
- The ticket remains open and in active SLA tracking between Phase 1 and Phase 2.
- Phase 2 closure requires the Integration Team to confirm that the partner's UAT submissions have been reviewed and approved, and to attach or reference the UAT sign-off record.
- Phase 2 closure triggers final completion notifications and seals the ticket.

---

**US-005a · UAT Completion Signal (T-02)**

> *As a member of the Integration team, I want a mechanism for the partner or requester to signal that UAT testing is complete so that I know when to begin the Phase 2 review.*

**Acceptance Criteria:**
- While a T-02 ticket is in Phase 1 Complete (awaiting Phase 2), a **"Mark UAT Testing Complete"** action is available to the Requester.
- The Requester must attach or reference UAT test results/evidence when marking complete.
- Upon marking complete, the Integration Team is notified that the ticket is ready for Phase 2 review.
- The Phase 2 SLA clock starts only when the Requester signals UAT completion — not when Phase 1 closes.
- If the Requester does not signal completion within a configurable window (e.g., 30 business days), an automatic reminder is sent. After a second threshold, the ticket is flagged for administrative review.

---

**US-005b · Fulfilment Detail Capture**

> *As a member of the Integration Team or Provisioning Team, I want to record the specific details of what was provisioned on a ticket so that there is a permanent, auditable record of the fulfilment actions taken.*

**Acceptance Criteria:**
- When completing any provisioning or integration action, the stage owner is presented with a structured **Fulfilment Record** form relevant to the action:
  - **T-02 Phase 1:** UAT environment URL, credentials issued (username only — passwords sent securely out-of-band), access permissions granted.
  - **T-03 Portal:** Partner account ID, portal URL, admin username created, all user account IDs and login emails provisioned.
  - **T-03 API:** IP addresses whitelisted, API key reference (not the key itself), certificate thumbprint, environment provisioned.
  - **T-04:** Confirmation of issue type (portal login / API credential), user affected, resolution action taken.
- Fulfilment details are permanently stored on the ticket and included in the audit trail.
- Sensitive credentials (passwords, full API keys) are **never** stored in the ticket — only references and confirmation that delivery occurred via a secure channel.

---

**US-006 · Submission Confirmation**

> *As a Requester, I want an immediate confirmation with a unique ticket reference upon submission so that I can track and reference my request.*

**Acceptance Criteria:**
- On submission, a unique ticket ID is generated per the defined convention (e.g., `SPM-RBT-T01-20260401-0001`).
- The Requester receives an email containing: ticket ID, product, task, submission timestamp, and a direct link to the ticket.
- The ticket appears immediately in the Requester's dashboard with status: **Submitted**.

---

**US-006a · Draft Management** *(MVP 2)*

> *As a Requester, I want to view, resume, and delete my saved drafts so that I can return to an incomplete submission without losing progress.*

**Acceptance Criteria:**
- A "My Drafts" section is visible on the Requester dashboard.
- Each draft displays: product, task, last saved timestamp, and completion percentage.
- Clicking a draft reopens the form with all previously entered data and uploaded documents restored.
- Requester can explicitly delete a draft. Drafts older than 30 days with no activity are automatically purged.
- A Requester may have multiple drafts in progress simultaneously.

---

**US-006b · Request Cancellation**

> *As a Requester, I want to cancel a submitted request that has not yet been actioned so that I can retract requests raised in error without requiring administrator intervention.*

**Acceptance Criteria:**
- A **Cancel** action is available on any ticket in **Submitted** status (i.e., before the first stage owner takes action).
- Cancellation requires a mandatory reason field.
- Upon cancellation: ticket status changes to **Cancelled**; all assigned stage owners are notified; SLA clock stops.
- Cancelled tickets remain in the audit trail and are visible in the Requester's history but cannot be re-opened.
- Once a ticket has been actioned by any stage owner (reviewed, returned, advanced), cancellation is no longer available — the Requester must request rejection through the current stage owner.

---

**US-006c · Re-raise After Rejection**

> *As a Requester, I want to re-raise a new request pre-populated with the data from a previously rejected ticket so that I can address the rejection reason without re-entering all information from scratch.*

**Acceptance Criteria:**
- On any ticket with status **Rejected**, a **Re-raise** button is available to the original Requester.
- Clicking Re-raise creates a new draft pre-populated with all field values and documents from the rejected ticket.
- The new ticket receives a fresh ticket ID and its own SLA clock.
- The new ticket's audit trail includes a reference link to the original rejected ticket ID.
- The Requester can modify any field before re-submitting, including changing the rejection-causing data.

---

### Epic 2 — Workflow Routing & Stage Management

---

**US-007 · Automatic Routing**

> *As a team member responsible for reviewing or provisioning requests, I want requests to arrive in my queue automatically so that I never miss an assignment.*

**Acceptance Criteria:**
- On submission, the system evaluates the Product × Task matrix (and API opt-in status for T-03) and routes the ticket to the correct first-stage queue without manual intervention.
- The assigned team receives an email and in-portal notification.
- If a stage has no approval gate (T-02, T-04), routing skips directly to Provisioning or Integration.

---

**US-008 · Stage Progression and Handoff**

> *As a Reviewer or Approver, I want to advance, reject, or return a ticket with a single documented action so that there is no ambiguity about when a handoff occurs.*

**Acceptance Criteria:**
- Each ticket displays: current stage, next stage, responsible party per stage.
- Stage owner actions: **Approve & Advance** | **Reject** | **Return for Clarification**.
- **Return for Clarification:** ticket status changes to **Pending Requester Action**; SLA clock pauses; Requester is notified with the clarification note.
- On Requester resubmission: SLA clock resumes; ticket returns to the stage that raised the query.
- All stage transitions are logged with actor, timestamp, action, and comments.

---

**US-009 · Lifecycle Pre-requisite Enforcement**

> *As the system, I want to enforce lifecycle state prerequisites at submission time so that no request can be raised for a partner who has not completed the required prior stage.*

**Acceptance Criteria:**
- When a T-02 is raised, the system checks that the partner is in **ONBOARDED** state for the same product. If not, submission is **blocked** with a clear message: *"This partner does not have a completed agreement (T-01) on [Product]. An agreement must be signed off before UAT access can be requested."*
- When a T-03 is raised, the system checks that the partner is in **UAT ACTIVE** state (T-02 Phase 2 signed off) for the same product. If not met, submission is **blocked**.
- T-04 requires the partner to be in **LIVE** state; submission is blocked otherwise.
- The blocking message includes a link to the partner's current lifecycle state and any in-progress prerequisite tickets.
- Lifecycle checks are enforced at the system level and cannot be overridden by any user role.

---

**US-009a · Ticket Reassignment**

> *As a Reviewer, Approver, or Provisioning Agent, I want to reassign a ticket in my queue to another qualified team member so that tickets are not blocked when I am unavailable.*

**Acceptance Criteria:**
- A **Reassign** action is available on any ticket currently assigned to the user.
- Reassignment target must be a user with the same role permissions for the relevant Product × Task combination.
- Reassignment requires a mandatory reason (e.g., "on leave", "conflict of interest", "specialist required").
- The reassignment is logged in the audit trail with: original assignee, new assignee, reason, and timestamp.
- SLA clock continues running — reassignment does not pause or reset the SLA.
- The new assignee and the Requester are both notified of the reassignment.

---

**US-009b · Ticket Comments**

> *As any SPM user, I want to add comments to a ticket so that I can share context, ask questions, and collaborate with other team members without bouncing the ticket back through the workflow.*

**Acceptance Criteria:**
- An **Add Comment** action is available on any ticket at any stage, to any user with access to that ticket.
- Comments are displayed in chronological order on the ticket detail view.
- Each comment captures: author (name and role), timestamp, and free-text content with optional file attachment.
- Comments are visible to all SPM users who have access to the ticket — SPM is a fully internal system with no external visibility.
- Comments are distinct from formal stage actions (Approve, Reject, Return for Clarification) and are clearly labelled as such.
- Comments are included in the audit trail and are part of the 7-year retention.

---

**US-009c · Delegated Approval**

> *As a System Administrator, I want to configure a delegate approver for any approval role so that tickets are not blocked when the primary approver is unavailable.*

**Acceptance Criteria:**
- System Administrator can assign one or more **delegates** to any approver role (e.g., Partner Director, EA signer, Legal lead).
- Delegation can be permanent (standing delegate) or time-bound (e.g., "delegate from 5 Apr to 12 Apr").
- When the primary approver has not actioned a ticket within a configurable threshold (e.g., 50% of stage SLA elapsed), the delegate is automatically notified and granted approval authority.
- Both the primary approver and delegate can act on the ticket — whichever acts first completes the stage.
- Delegation events and delegate actions are logged in the audit trail.

---

### Epic 3 — SLA Management

---

**US-010 · SLA Countdown per Stage**

> *As a team member and manager, I want SLA countdowns to activate automatically at each stage so that there is always visible time accountability.*

**Acceptance Criteria:**
- SLA clock starts the moment a ticket enters each stage.
- T-02 tracks two independent SLA clocks: one for Phase 1 (access provisioning) and one for Phase 2 (UAT sign-off).
- Clock is displayed in hours and minutes on the ticket detail view and in all queue views.

---

**US-011 · SLA Breach Alerts**

> *As a stage owner and their manager, I want escalating alerts as SLA approaches and breaches so that we can act before deadline.*

**Acceptance Criteria:**
- 75% elapsed: amber alert to stage owner; ticket flagged amber in queue.
- 90% elapsed: red alert to stage owner and line manager.
- 100% (breach): ticket status → **SLA Breached**; notification to stage owner, manager, and System Administrator; ticket pinned to top of queue.
- All breach events are permanently recorded on the ticket audit trail.

---

### Epic 4 — Notifications

---

**US-012 · Milestone Notification Framework**

> *As any stakeholder, I want timely, relevant notifications at defined milestones so that I am always informed without manually checking the portal.*

| Milestone | Recipients |
|---|---|
| Request Submitted | Requester, Stage 1 Owner |
| Stage Approved & Advanced | Requester, Next Stage Owner |
| Clarification Requested | Requester |
| Requester Responds to Clarification | Current Stage Owner |
| T-02 Phase 1 Complete (UAT Access Live) | Requester, Partner Contact, Internal Owners |
| T-02 UAT Testing Marked Complete by Requester | Integration Team |
| T-02 Phase 2 Complete (UAT Signed Off) | Requester, Partner Contact, Internal Owners |
| T-02 UAT Completion Reminder (configurable window) | Requester |
| T-03 Portal Account Provisioned | Requester, Partner Contact |
| T-03 API Credentials Issued | Requester, Technical Contact |
| T-04 Access Issue Resolved | Requester |
| Request Rejected | Requester |
| Request Cancelled | Assigned Stage Owner(s) |
| Ticket Reassigned | New Assignee, Requester |
| Delegate Approval Triggered | Delegate Approver |
| SLA Warning 75% | Stage Owner (+ Delegate if configured) |
| SLA Warning 90% | Stage Owner + Manager (+ Delegate if configured) |
| SLA Breach | Stage Owner + Manager + Admin |
| Request Completed | Requester |

All notifications include: ticket ID, product, task, current status, and a deep-link to the ticket. All notifications sent are logged against the ticket record.

---

### Epic 5 — Audit Trail

---

**US-013 · Immutable Audit Log**

> *As a System Administrator, Compliance Officer, or Auditor, I want every action on every ticket permanently recorded so that a complete and tamper-proof history is always available.*

**Acceptance Criteria:**
- Every event is logged: submission, stage transitions, approvals, rejections, clarification exchanges, document uploads, API opt-in selections, SLA events, notifications sent, phase closures, and ticket completion.
- Each entry captures: actor (name, role, user ID), timestamp (UTC), action type, and any comment.
- The audit log is append-only and cannot be edited or deleted by any user, including System Administrators.
- Exportable as CSV or PDF from the ticket detail view.
- Retained for a minimum of 7 years.

---

### Epic 6 — Dashboards & Reporting

---

**US-014 · Requester Dashboard**

> *As a Requester, I want a dashboard showing all my requests, their current status, and any actions required from me.*

**Acceptance Criteria:**
- Displays all tickets raised by the Requester, sortable by date, status, product, and task.
- Tickets requiring Requester action are surfaced with a prominent call-to-action.
- T-02 tickets display the current phase (Phase 1 / Phase 2) and its status.

---

**US-015 · Team Queue View**

> *As a Reviewer, Approver, or Provisioning Agent, I want a queue showing all tickets assigned to my team, sorted by urgency.*

**Acceptance Criteria:**
- Columns: Ticket ID, Product, Task, Partner Name, Requester, Stage, Phase (T-02), SLA Status, Time Remaining.
- Breached and near-breach tickets pinned to top; highlighted in red/amber.
- Filterable by Product, Task, Stage, SLA Status, and API opt-in flag (T-03).

---

**US-016 · Operations Reporting Dashboard**

> *As a manager or System Administrator, I want aggregated reporting across all requests so that I can identify bottlenecks and track SLA performance.*

**Acceptance Criteria:**
- Metrics: total requests by period, breakdown by product and task, average resolution time per task type, SLA compliance rate, volume per stage, rejection rate with top rejection reasons, API vs. portal split for T-03, T-02 Phase 1 vs Phase 2 average duration.
- Date range filter: last 7, 30, 90 days, or custom range.
- Data exportable as CSV.

---

### Epic 7 — Search & Lookup

---

**US-017 · Global Search**

> *As any portal user, I want to search across all tickets, partners, and users from a single search bar so that I can quickly find any record without navigating through multiple screens.*

**Acceptance Criteria:**
- A persistent global search bar is available from every page in the portal.
- Search accepts: ticket ID (full or partial), partner name, product code, requester name, or partner contact email.
- Results are returned in under 1 second and grouped by result type (Tickets, Partners, Users).
- Each result shows: ticket ID or entity name, product, current status/lifecycle state, and last updated date.
- Clicking a result navigates directly to the ticket detail or partner profile view.
- Search respects RBAC — users only see results they are authorised to access.

---

**US-018 · Partner Lookup & History**

> *As a Reviewer, Approver, or System Administrator, I want to look up a partner and see their complete request history across all products so that I have full context when processing any request.*

**Acceptance Criteria:**
- A dedicated Partner Lookup view is accessible from the main navigation.
- Searching by partner name or partner account reference returns the partner profile.
- The partner profile displays:
  - Partner name, product(s), and current lifecycle state per product
  - A chronological timeline of all tickets raised for this partner across all products and task types
  - Agreement status and effective date (T-01 records) — agreements are auto-renewed
  - UAT status per product (T-02 records)
  - Active accounts and users per product (T-03 records)
- Each ticket entry in the timeline is clickable and links to the full ticket detail view.
- The partner profile is read-only; no edits are permitted from this view.

---

**US-019 · Advanced Ticket Search & Filtering**

> *As a team member or manager, I want to perform advanced searches with multiple filter criteria so that I can find specific subsets of tickets for operational review.*

**Acceptance Criteria:**
- An Advanced Search view allows filtering by any combination of: product, task type, status, lifecycle state, SLA status (on track / at risk / breached), date range (submitted, completed), requester, assigned team, partner name, and API opt-in flag (T-03).
- Filters are combinable (AND logic) and can be cleared individually or all at once.
- Results display in a sortable table with columns matching the Team Queue View (US-015).
- Search results are exportable as CSV.
- Saved search filters: users can save frequently used filter combinations and recall them by name.

---

### Epic 8 — System Administration

---

**US-020 · Workflow Routing Configuration**

> *As a System Administrator, I want to configure and modify the routing rules for each Product × Task combination so that workflow paths can be updated without code changes.*

**Acceptance Criteria:**
- An admin interface displays the full Product × Task routing matrix.
- For each combination, the administrator can: view the current routing path, modify stage sequence, assign responsible teams per stage, and enable/disable approval gates.
- Product-specific routing overrides (e.g., Mulem API credential resets routed to Integration rather than Provisioning) are configurable per Product × Task cell.
- All configuration changes are versioned — the system retains a history of previous configurations with timestamps and the administrator who made the change.
- Configuration changes take effect for new tickets only; in-flight tickets continue on the routing path active at submission time.

---

**US-021 · SLA Target Configuration**

> *As a System Administrator, I want to configure SLA targets per Product × Task × Stage so that SLA commitments can be adjusted as operational capacity changes.*

**Acceptance Criteria:**
- SLA targets are configurable in business hours per stage within each Product × Task combination.
- The administrator can configure SLA warning thresholds (default: 75% and 90%) per stage.
- Changes to SLA targets apply to new tickets only; in-flight tickets retain the SLA in effect at submission.
- SLA change history is retained with timestamps and administrator identity.

---

**US-022 · Business Hours & Holiday Calendar**

> *As a System Administrator, I want to define business hours and public holidays so that SLA clocks accurately reflect working time.*

**Acceptance Criteria:**
- Business hours are configurable: working days (default: Sunday–Thursday), start time, and end time (default: 08:00–17:00 GST).
- A holiday calendar allows the administrator to define public holidays for the current and next calendar year.
- SLA clocks automatically exclude non-business hours and holidays.
- Changes to business hours or holidays take effect immediately for all in-flight and new tickets.

---

**US-023 · User & Role Management**

> *As a System Administrator, I want to manage portal user accounts and their role assignments so that access control remains current as team members join, leave, or change roles.*

**Acceptance Criteria:**
- Administrator can create, deactivate, and modify portal user accounts.
- Each user is assigned one or more roles (Requester, Reviewer, Approver, Integration Team, Provisioning Agent, System Administrator).
- Roles are scoped by Product — a user may be a Reviewer for Rabet but not for Mulem.
- Deactivated users cannot log in or receive assignments; their historical actions remain in audit trails.
- Bulk user import via CSV is supported for initial onboarding.
- SSO group mapping is configurable: SSO groups can be mapped to SPM roles for automatic provisioning.

---

## Non-Functional Requirements

| Requirement | Specification |
|---|---|
| **Availability** | 99.9% uptime during business hours; 99.5% outside |
| **Performance** | Page load < 2 seconds; form save < 500 ms |
| **Security** | RBAC; SSO integration; all data encrypted at rest and in transit (TLS 1.3) |
| **Accessibility** | WCAG 2.1 AA compliant |
| **Browser Support** | Chrome, Edge, Firefox, Safari (latest two major versions) |
| **Audit Retention** | 7 years minimum |
| **Localisation** | English (primary); Arabic (future consideration) |

---

## Completion & Closure Definitions

**Complete:** All workflow stages traversed → final stage owner confirms fulfilment → Requester notified → audit trail sealed.

**Closed — Rejected:** Any authorised stage owner rejects with documented reason → Requester notified → rejection logged. No request may be deleted. All records persist indefinitely.

**T-02 specific:** Ticket is not complete until both Phase 1 (access) and Phase 2 (UAT sign-off) are formally closed by the Integration Team.

---

*Document version 1.4 | SPM Portal*
*Owner: [Product Owner Name] | Last reviewed: April 2026*
