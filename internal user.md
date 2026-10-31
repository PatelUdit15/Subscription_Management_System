# Internal User Module — Subscription Management System

## 1. Purpose and Scope
This document defines the requirements and permitted operational scope for an **Internal User** in the Subscription Management System for Brightloop Software.

The system centralizes subscription-based products, recurring plans, quotations, subscriptions, invoices, taxes, discounts, payments, and reporting. Internal Users support day-to-day operations with limited access. This file intentionally excludes Admin-specific and Customer/Portal User-specific requirements.

## 2. Role Definition and Access Boundary
- **Role:** Internal User
- **Purpose:** Handle day-to-day operational work in the subscription and billing workflow.
- **Access level:** Limited operational access; not full system control.
- **Account creation:** Only an Admin can create an Internal User account.
- **Authorization principle:** Internal Users must only be able to access actions and records permitted to their role. The source documents do not define a detailed permission matrix, so exact per-module create/read/update/delete permissions must be decided during implementation rather than assumed.

## 3. Authentication and Account Access
The system's authentication requirements relevant to Internal Users are:
- Login using email and password.
- Email addresses must be unique across accounts.
- Password length must be **greater than 8 characters**.
- Password must contain:
  - At least one uppercase letter.
  - At least one lowercase letter.
  - At least one special character.
- Password reset must verify the registered email and send a reset link to that email.

**Implementation note:** The requirements specify these password rules but do not specify password hashing, session/token strategy, reset-link expiry, or multi-factor authentication. Those details are not defined by the supplied documents.

## 4. Operational Modules
Internal Users are described as handling day-to-day work. The overall system contains the modules below, but the supplied documents do not assign a precise Internal User permission set to each one. Treat the list as operational areas potentially relevant to this role, subject to the final role-permission matrix.

### 4.1 Products and Product Variants
Product data described by the specification:
- Product name
- Product type
- Sales price
- Cost price
- Notes
- Product variants with attribute, value, and extra price

Example from the specification: selecting the **Odoo** brand variant adds **560** to the price.

The source identifies product configuration as an Admin activity; it does not explicitly grant Internal Users permission to create, edit, or delete products. Do not grant those permissions by assumption.

### 4.2 Recurring Plans
Plan data and options described by the specification:
- Plan name
- Price
- Billing period: daily, weekly, monthly, or yearly
- Minimum quantity
- Start date and end date
- Auto-close
- Closable
- Pausable
- Renewable

The source identifies plan configuration as an Admin decision. Internal User permissions for modifying plan settings are not specified.

### 4.3 Quotations and Subscription Creation
Quotation templates contain:
- Template name
- Validity days
- Recurring plan
- Product lines

A subscription contains:
- Subscription number
- Customer reference
- Plan
- Start date
- Expiration date
- Payment terms
- Order lines containing product, quantity, unit price, taxes, and amount

The specified subscription lifecycle is:

`Draft → Quotation → Confirmed → Active → Closed`

The system should make the subscription's current status visible to the team. Internal Users' exact permissions for creating quotations, confirming subscriptions, changing lifecycle status, pausing, renewing, or closing subscriptions are not explicitly defined in the source documents and require a permission decision.

### 4.4 Invoice Operations
Invoices are generated automatically from subscriptions and include:
- Customer details
- Product lines
- Taxes
- Totals

The listed invoice actions are:
- Confirm
- Cancel
- Send
- Print

The specified invoice status flow is:

`Draft → Confirmed → Paid`

The documents expect the team to be able to work with invoices and identify their status, but they do not explicitly define which of these actions Internal Users may perform. Enforce only the actions approved in the final permission matrix.

### 4.5 Payment Tracking
Payment records include:
- Payment method
- Amount
- Payment date
- Note (mentioned in the scenario description)

Payments are recorded against the correct invoice. The system should show which invoices are paid and which remain outstanding so overdue invoices can be followed up. The documents do not specify the complete payment-method list or exact Internal User create/edit/delete permissions.

### 4.6 Discounts
Discount rules can be:
- Fixed amount or percentage
- Restricted by minimum purchase and/or minimum quantity
- Limited by start date, end date, and usage limit
- Applied to specific products or whole subscriptions

Discounts should apply to the next invoice automatically when eligible and stop when expired or when the usage limit is exhausted.

**Role boundary:** The documents explicitly state that only Admins can create discount rules. Internal Users must not receive permission to create discount rules. Other discount-related permissions (such as viewing or applying an existing rule manually) are not explicitly specified.

### 4.7 Taxes
Tax rules support configurable tax percentages and types and are automatically calculated during invoice generation.

**Role boundary:** Tax configuration is described as an Admin-configured capability. The documents do not explicitly grant Internal Users permission to create or modify tax rules.

### 4.8 Reports and Operational Dashboard
The reporting module includes:
- Active subscriptions
- Revenue
- Payments
- Overdue invoices
- Filters and summary views

The finance/operations view is intended to help the team answer operational questions quickly. The documents do not define which report fields or financial totals each role may see. Limit report access to the approved role permissions and any applicable data-access rules.

## 5. Business Rules Relevant to Internal Operations
- Subscription records must follow the defined lifecycle.
- Invoices are generated from subscriptions rather than being manually re-created for each billing cycle.
- Invoice generation must not bill twice or skip a due billing event.
- Taxes are calculated automatically from configured rules.
- Eligible discounts apply automatically and stop when expired or usage-limited.
- Payments must be linked to the correct invoice.
- The system must identify paid, outstanding, and overdue invoices.
- Internal Users have limited operational access and must not have unrestricted system control.

## 6. Non-Functional Requirements
The system-wide requirements relevant to this role are:
- **Performance:** Pages/requests should respond in under 2 seconds.
- **Scalability:** Support thousands of subscriptions.
- **Security:** Secure authentication and role-based permissions.
- **Usability:** Simple, intuitive UI.
- **Reliability:** High availability.

## 7. Recommended Internal User Navigation
The source documents list a Dashboard & Navigation module but do not provide a final Internal User menu. A reasonable proposed navigation, subject to approval, is:
- Dashboard
- Quotations / Quotation Templates (permission-dependent)
- Subscriptions
- Invoices
- Payments
- Reports

Products, recurring-plan settings, discounts, and tax configuration should remain unavailable for modification unless a specific permission is explicitly approved. This navigation is a proposal, not a confirmed requirement from the PDFs.

## 8. Permission Matrix — What the Documents Actually Establish

| Capability | Source-backed rule for Internal User |
|---|---|
| Log in with email/password | Authentication module supports email/password login |
| Unique email and strong password | Required validation rules |
| Reset password by email link | Supported authentication flow |
| Internal User account creation | Admin only |
| Day-to-day operational work | Explicitly within Internal User role purpose |
| Create discount rules | **Not allowed** — Admin only |
| Full system configuration | Not allowed by role definition; Internal User has limited access |
| Access to each module and CRUD actions | Not fully specified; requires a final permission matrix |
| Product/plan/tax configuration | Admin-oriented in source; Internal User editing permissions not granted by the documents |
| Customer/portal self-service features | Excluded from this Internal User document |

## 9. Implementation Checklist
- [ ] Represent Internal User as a distinct role in the authorization model.
- [ ] Ensure only an Admin can create Internal User accounts.
- [ ] Validate unique email addresses.
- [ ] Enforce the documented password requirements.
- [ ] Provide registered-email password reset.
- [ ] Apply role checks on backend endpoints, not only in the frontend UI.
- [ ] Define and approve module-level permissions for read/create/update/delete and workflow actions.
- [ ] Explicitly deny Internal Users the ability to create discount rules.
- [ ] Restrict configuration changes unless approved by the permission matrix.
- [ ] Ensure payment-to-invoice association and invoice/subscription statuses are consistent.
- [ ] Test that Internal Users cannot access Admin-only operations or Customer/Portal-only functions.
- [ ] Verify performance targets against realistic volumes.

## 10. Source Notes and Boundaries
This document was compiled from the two supplied PDFs:
1. `Subscription_Management_System.pdf` — business scenario and monthly workflow.
2. `Subscription Management System (1).pdf` — structured overview, roles, modules, fields, and requirements.

Where the PDFs do not explicitly define Internal User permissions, this file labels the point as unspecified or proposed instead of treating an assumption as a requirement. Admin and Customer/Portal User feature specifications are intentionally omitted except where necessary to state a role boundary (for example, Admin-only account creation and discount-rule creation).
