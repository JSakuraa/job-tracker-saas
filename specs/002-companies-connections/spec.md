# Feature Specification: Companies and Connections Management

**Feature Branch**: `002-companies-connections`  
**Created**: 2026-06-22  
**Status**: Draft  
**Input**: User description: "I want to plan a new spec that builds out the companies and also a connections piece of the app. Companies should persist between jobs and the ranking section. If a company exists as a ranking it should be an autofill option for creating an application. If a company is inputted as in an application, but it is not already in the company database it should be added. Companies that are added should be unranked unless explicitly ranked by the user. For connections, I want to create a tab that lets the user create connections that they can keep track of, like a phone book almost. It should let them add the person, contact info/how they are in touch (email, linkedin, phone number, etc.), the company they work for, and whether or not it is a connection made or just a cold reach out attempt"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Unified Company Database (Priority: P1)

A user works across both the job applications list and the Companies tab. When they type a company name in either area, the system draws from a single shared list of companies so they never have to re-enter the same company twice. If they enter a company that doesn't exist yet, it is automatically added to the shared database in an unranked state.

**Why this priority**: This is the foundational data layer that makes all other features coherent. Without a unified company store, companies in applications and the Companies tab are disconnected islands, creating duplicate effort and inconsistent data.

**Independent Test**: Can be fully tested by creating an application with a new company name, then navigating to the Companies tab and verifying the company now appears in the full list there, unranked.

**Acceptance Scenarios**:

1. **Given** a user is creating a new application and types a company name that does not exist in the database, **When** they save the application, **Then** the company is automatically added to the shared company database with an unranked status.
2. **Given** a company has been explicitly ranked by the user, **When** the user begins typing that company name in the application creation form, **Then** the company name appears as an autofill suggestion.
3. **Given** a user has companies from both their applications and Companies tab, **When** they view the company list in any section of the app, **Then** all companies from both sources appear in a single unified list without duplicates.
4. **Given** a user adds a company via the application form, **When** they navigate to the Companies tab, **Then** the new company appears in the full list with no rank assigned and is not sorted into the ranked section until explicitly ranked.

---

### User Story 2 - Company Autofill in Application Creation (Priority: P2)

A user creating a new job application types a company name and is offered matching suggestions from the existing company database, reducing errors and reinforcing data consistency across the app.

**Why this priority**: Autofill accelerates application entry and ensures the correct company entity is linked, which prevents data fragmentation as the user's company list grows.

**Independent Test**: Can be fully tested by pre-populating at least one company, then opening the application creation form and verifying the company appears as a suggestion as the user types.

**Acceptance Scenarios**:

1. **Given** the company database has existing entries, **When** a user begins typing in the company name field on the application form, **Then** matching company names from the database appear as a dropdown suggestion list.
2. **Given** a user selects a suggestion from the autofill dropdown, **When** the selection is made, **Then** the company name field is populated with the exact stored company name.
3. **Given** a user types a name that does not match any existing company, **When** they submit the form, **Then** the new company is created and saved before the application is persisted.

---

### User Story 3 - Connections Phone Book (Priority: P3)

A user navigates to a dedicated Connections tab and can add, view, and manage a personal network of professional contacts. Each contact record stores the person's name, how to reach them (email, LinkedIn, phone number), the company they work for, and whether the relationship is an established connection or a cold outreach attempt.

**Why this priority**: Connections is a new standalone section that delivers significant value for job seekers managing their network. It can be shipped independently once companies are in place, since contacts may be linked to companies from the shared database.

**Independent Test**: Can be fully tested by navigating to the Connections tab, adding a new contact with all fields, and verifying the contact appears in the list with the correct details and status indicator.

**Acceptance Scenarios**:

1. **Given** a user is on the Connections tab, **When** they add a new contact with name, email, LinkedIn URL, phone number, company, connection status, and optional notes, **Then** the contact is saved and displayed in the connections list with a truncated notes preview if notes were provided.
2. **Given** an existing contact record, **When** the user edits any field and saves, **Then** the updated information is reflected immediately in the connections list.
3. **Given** a user is adding a contact, **When** they enter a company name, **Then** the company field offers autofill suggestions from the shared company database.
4. **Given** a contact is marked as "cold outreach," **When** the user views the connections list, **Then** the contact is visually distinguished from contacts marked as "established connection."
5. **Given** a contact is marked as "cold outreach," **When** the user clicks the "Mark as Connected" quick action on that contact's card, **Then** the relationship type is immediately updated to "established connection" without opening the full edit form.
6. **Given** a user wants to find a specific contact, **When** they search or filter the connections list, **Then** results are narrowed to matching entries.

---

### User Story 4 - Companies Tab: Full List and Ranking (Priority: P4)

A user navigates to the Companies tab and sees their entire company list — both ranked and unranked entries — in one place. From here they can assign or update a rank for any company, rename companies, and delete unlinked companies. Ranked companies are surfaced first in autofill suggestions across the app.

**Why this priority**: The Companies tab is the central management hub for companies. It builds on P1's shared database by providing a visible, editable surface. Ranked companies boost autofill relevance, rewarding users who invest time curating their list.

**Independent Test**: Can be fully tested by navigating to the Companies tab, verifying all companies (from applications and contacts) appear in the list, ranking two of them, then opening an application form and confirming those ranked companies appear at the top of autofill suggestions.

**Acceptance Scenarios**:

1. **Given** a user navigates to the Companies tab, **When** the page loads, **Then** all companies in the database (ranked and unranked) are displayed with their current rank status visible.
2. **Given** a user has explicitly ranked one or more companies, **When** they type in the company field during application creation, **Then** ranked companies matching the input appear above unranked companies in the suggestion list.
3. **Given** a company is unranked, **When** the user assigns it a rank in the Companies tab, **Then** the company's rank status is immediately reflected across the app (autofill ordering, company list display).
4. **Given** a company has no linked applications or contacts, **When** a user deletes it from the Companies tab, **Then** it is removed from the database and no longer appears in autofill suggestions.
5. **Given** a user wants to correct a misspelled company name, **When** they rename the company in the Companies tab, **Then** the updated name is immediately reflected in all linked applications and contacts.

---

### Edge Cases

- What happens when a user enters a company name that differs only in casing or whitespace from an existing entry (e.g., "Google" vs "google")? The system should treat these as the same company and normalize to the existing stored name.
- What happens when a user deletes a company that is referenced by existing applications or contacts? Deletion is blocked; the system displays a message listing how many applications and contacts reference the company. The user must remove or re-assign those references before the company can be deleted.
- What happens when a contact's linked company is later renamed or merged? The connection should remain intact and display the updated company name.
- What happens when a user submits a contact with no contact info fields filled in (only a name)? The system should allow partial records since not all contact details may be known upfront.
- What happens when two contacts work at the same company? Both should reference the shared company entity without duplication.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST maintain a single shared company database that is referenced by the job applications section, the Companies tab, and the Connections tab.
- **FR-002**: The system MUST automatically add a company to the shared database when a user enters a new company name in the application creation form, if that company does not already exist.
- **FR-003**: Companies added automatically via application entry MUST default to an unranked state.
- **FR-004**: The system MUST provide company name autofill suggestions when a user types in the company name field on the application creation form, drawn from the shared company database.
- **FR-005**: The system MUST normalize company names to prevent duplicate entries caused by case differences or leading/trailing whitespace.
- **FR-006**: The system MUST include a dedicated Companies tab in the main navigation that displays all companies (ranked and unranked) and serves as the primary management interface for company records.
- **FR-007**: Users MUST be able to explicitly rank a company from the Companies tab, and that ranking MUST be persisted in the shared company database.
- **FR-007a**: The company entry field in the Companies tab MUST offer autofill suggestions from the existing company database; selecting an existing company opens it for ranking rather than creating a duplicate entry.
- **FR-008**: Users MUST be able to rename a company from the Companies tab; the updated name MUST be reflected immediately across all linked applications and contacts.
- **FR-009**: The system MUST include a dedicated Connections tab in the main navigation.
- **FR-010**: Users MUST be able to create a contact record with the following fields: full name, email address, LinkedIn profile URL, phone number, company (linked to shared company database), relationship type (established connection or cold outreach), and notes (free-text, optional).
- **FR-011**: All contact info fields except full name MUST be optional, allowing partial records.
- **FR-012**: Users MUST be able to edit and delete contact records via a full edit form.
- **FR-012a**: Contact cards for "cold outreach" contacts MUST display a "Mark as Connected" quick action that immediately updates the relationship type to "established connection" without requiring the full edit form.
- **FR-013**: The Connections tab MUST display all saved contacts in a list or grid view with at minimum name, company, relationship type, and a truncated notes preview (if notes exist) visible at a glance.
- **FR-014**: The system MUST visually distinguish contacts marked as "established connection" from those marked as "cold outreach" in the connections list.
- **FR-015**: The company field on the contact creation form MUST offer autofill suggestions from the shared company database.
- **FR-016**: Users MUST be able to search or filter their connections list by name, company, or relationship type.
- **FR-017**: The system MUST prevent deletion of a company that is referenced by one or more applications or contacts, and MUST display a message indicating how many records reference that company before deletion can proceed.

### Key Entities

- **Company**: Represents an employer or organization. Key attributes: name (unique, normalized), rank (optional integer or null if unranked), source (how it was first added — e.g., via application, via Companies tab, via contact). Referenced by applications, the Companies tab, and contacts.
- **Connection**: Represents a professional contact in the user's network. Key attributes: full name, email (optional), LinkedIn URL (optional), phone number (optional), linked company (optional, references Company), relationship type (established connection | cold outreach), notes (optional). Belongs to the authenticated user.
- **Application** (existing): Updated to reference the shared Company entity rather than storing a raw company name string.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can add a new contact with all fields completed in under 60 seconds from opening the Connections tab.
- **SC-002**: Company autofill suggestions appear within 300ms of the user beginning to type in any company name field.
- **SC-003**: Zero duplicate company entries exist for the same employer across the applications, Companies tab, and Connections tab after a user completes a normal workflow.
- **SC-004**: 100% of companies entered via application creation appear in the shared company database immediately after the application is saved.
- **SC-005**: Users can locate a specific contact by searching in under 10 seconds on a list of up to 200 contacts.
- **SC-006**: The Connections tab and company autofill function correctly on both desktop and mobile screen sizes.

## Clarifications

### Session 2026-06-22

- Q: When a user attempts to delete a company referenced by existing applications or contacts, what should the system do? → A: Block deletion — show a message listing how many applications/contacts reference the company; deletion is not allowed until those are removed or re-assigned.
- Q: Is a dedicated company management interface in scope, and where should it live? → A: Rename the Rankings section to "Companies tab" — it houses both the full company list (ranked + unranked) and ranking functionality; company rename and delete are managed from here.
- Q: How does a user upgrade a "cold outreach" contact to "established connection"? → A: Both — a "Mark as Connected" quick-action button on the contact card for speed, plus the full edit form as a fallback.
- Q: Should the company entry field in the Companies tab also offer autofill from the existing database? → A: Yes — autofill on all three entry points (application form, Companies tab, contact form); selecting an existing company opens it for ranking rather than creating a duplicate.
- Q: Should contact records include a free-text notes field? → A: Yes — multi-line notes field on creation and edit forms; truncated preview displayed in the contact list.

## Assumptions

- Users are authenticated; all company and connection data is scoped to the individual user account.
- The existing rankings feature (being renamed to the Companies tab) stores company names as raw strings today; this feature will migrate that data to the new shared Company entity model.
- Mobile responsiveness is in scope, but a native mobile app is not — the Connections tab is a web view.
- Contact records do not need to sync with external address books or LinkedIn in this version; this is a manual phone book only.
- A contact can be associated with at most one company at a time (the company they currently work for).
- The relationship type field has exactly two options: "established connection" and "cold outreach." Additional statuses (e.g., "interview contact," "recruiter") are out of scope for this version.
- Full-text search on connections is acceptable at launch; advanced filtering (date added, last contacted) is out of scope for this version.
- The existing `applications` table will be updated to use a foreign key to the new `companies` table, and a migration will handle backfilling existing application records.
