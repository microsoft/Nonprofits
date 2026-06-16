Volunteer Engagement Public Source — Overview
======================================================

Scope note: this file is legacy/product background for migration analysis. It includes historical portal package details, legacy Liquid pages, and duplicated EN/FR portal structure. For current `Portal-EDM` React SPA routes, Web API service mappings, bootstrap behavior, and deployment assumptions, use `Portal-EDM/docs/operational-notes.md` and the current source files.

1. Solution Overview
--------------------

This public source folder contains the Volunteer Engagement Power Pages Enhanced Data Model React SPA and AI-assisted migration guidance. It does not contain the legacy managed solution package, ConfigData portal package, Package Deployer project, or Dataverse solution source.

The deployed Volunteer Engagement site depends on Common Data Model for Nonprofits and Volunteer Management in the target environment:
| Solution | Unique Name | Version | Purpose |
| --- | --- | --- | --- |
| **Volunteer Engagement SPA** | `Portal-EDM` | 2.0.0 | Self-service Power Pages site for volunteers on Enhanced Data Model |
| **Volunteer Management** | `VolunteerManagement` | 1.0.3.x | Model-driven Dataverse app for nonprofit staff (entities, plugins, PCF controls, workflows) |
**Publisher:** Microsoft Tech for Social Impact (`microsofttechforsocialimpact`)  
**Customization prefix:** `msnfp` (option value prefix: `84406`)
**Key finding:** VolunteerEngagement **cannot function without VolunteerManagement** installed. The portal queries 6 VM-owned entities at runtime. This dependency is implicit (not declared in Solution.xml).

2. VolunteerEngagement Solution — Component Inventory
-----------------------------------------------------

### 2.1 Dataverse Entities (5)

VE adds portal-specific forms and views to entities owned by NonprofitCore:
| Entity | Schema Name | What VE Adds |
| --- | --- | --- |
| Contact | `contact` | Portal profile web form (availability + preferences/qualifications as subgrids) |
| Availability | `msnfp_availability` | "VE Portal Availability Form" (title, effective from/to, working days) |
| Preference | `msnfp_preference` | "VE Portal Preference Form" (name, preference type lookup) |
| Qualification | `msnfp_qualification` | "VE Portal Form" (qualification type, start/end dates, current stage) |
| Qualification Type | `msnfp_qualificationtype` | Portal lookup reference (no custom forms) |

> **VE does not own any entities.** All 5 entities are created by NonprofitCore; VE adds forms and views for portal rendering.

### 2.2 Power Pages Portal (EN + FR)

Two complete portal deployments — English (`Portal/`) and French (`Portal-French/`):

#### 2.2.1 Web Pages (13)

| Page | URL | Visible to Users | Purpose |
| --- | --- | --- | --- |
| Home | `/` | Yes | Landing page — search, filters, engagement opportunity cards |
| Opportunities | `/opportunities` | Yes | Browse all public volunteer opportunities |
| Engagement Details | `/engagement` | Yes | Single opportunity detail — description, shifts, qualifications, apply action |
| My Engagements | `/my-engagements` | Yes | Volunteer's dashboard — registered upcoming + completed engagements |
| Profile | `/profile` | Yes (hidden from nav) | Tabbed user profile management hub |
| Profile - Availability | `/profile-availability` | Yes (child page) | Edit availability schedule |
| Profile - Preferences & Qualifications | `/profile-prefandqual` | Yes (child page) | Manage preferences and qualifications |
| Services | `/services` | Yes | Informational page |
| Success | `/success` | Yes | Post-action confirmation |
| Search | `/search` | Hidden | Global search results |
| Get Engagements | `/get-engagements` | Hidden | Internal API endpoint for AJAX engagement fetching |
| Page Not Found | `/page-not-found` | Hidden | 404 error page |
| Access Denied | `/access-denied` | Hidden | 403 error page |

#### 2.2.2 Web Templates (65)

| Category | Count | Examples |
| --- | --- | --- |
| Layout framework | ~15 | `layout-1-column`, `layout-2-column-wide-left`, `layout-2-column-wide-right`, `layout-3-column`, `full-page`, `page-with-side-navigation-(2-columns)` |
| Volunteer-specific (`msve_*`) | 20 | `msve_home`, `msve_engagementdetails`, `msve_engagementdetails-js`, `msve_engagementcards-js`, `msve_myengagements`, `msve_myengagements-card`, `msve_myengagements-fetch`, `msve_publicengagements-fetch`, `msve_publicengagements-getengagements`, `msve_qualifications-fetch`, `msve_prefsandquals-fetch`, `msve_engagement-fetch`, `msve_engagement-engagementschedules-fetch`, `msve_engagements-participationschedules-fetch`, `msve_engagementinfo-status`, `msve_footer`, `msve_global-js-webapiwrapper`, `msve_headerstatusbarandtabs`, `msve_missingcontent`, `msve_sortby` |
| UI components | ~15 | `breadcrumbs`, `header`, `footer`, `pagination`, `tab-header`, `page-header`, `page-copy` |
| Search components | ~7 | `faceted-search---main-template`, `faceted-search---results-template`, `faceted-search---facets-template`, `faceted-search---paging-template`, `faceted-search---sort-template`, `search`, `search-results` |
| Navigation & structure | ~10 | `child-navigation`, `side-navigation`, `sitemap`, `sitemap-item`, `weblink-list-group`, `languages-dropdown`, `navbar-left`, `listing`, `category`, `category-topic` |
| Misc | ~5 | `ad`, `poll`, `snippet`, `power-virtual-agents`, `opportunity-details-template` |

#### 2.2.3 Basic Forms (5)

| Form | Entity | Purpose |
| --- | --- | --- |
| Availability - Profile | `msnfp_availability` | Create/edit/delete availability records |
| Preferences - Profile | `msnfp_preference` | Create/edit preference records |
| Qualifications - Profile | `msnfp_qualification` | Create/edit/delete qualification records |
| Profile - Availability | `contact` | View/edit availability tab on contact profile |
| Profile - Preferences and Qualifications | `contact` | View/edit preferences & qualifications tab |

#### 2.2.4 Table Permissions (18)

| Table | Source Solution | Anonymous | Authenticated | Admin |
| --- | --- | --- | --- | --- |
| `msnfp_publicengagementopportunity` | VM | Read | Read | Read/Write |
| `msnfp_engagementopportunity` | VM | — | Read/Write | Read/Write |
| `msnfp_engagementopportunityschedule` | VM | Read | Read | Read/Write |
| `msnfp_participation` | VM | — | Read/Write/Create | Full |
| `msnfp_participationschedule` | VM | — | Read/Write | Full |
| `msnfp_availability` | NonprofitCore | — | Read/Write/Create/Append | Full |
| `msnfp_qualification` | NonprofitCore | — | Read/Write/Create/Delete/Append | Full |
| `msnfp_preference` | NonprofitCore | — | Read/Write/Create/Delete/AppendTo | Full |
| `msnfp_preferencetype` | NonprofitCore | Read | Read | Read |
| `msnfp_qualificationtype` | NonprofitCore | Read | Read | Read |
| `contact` | System | — | Read/Write (self) | Full |

#### 2.2.5 Content Snippets (163)

All UI text, labels, icons, status messages, filter labels, error messages, and SVG icons stored as database-driven content snippets. Categories include:
*   Account & authentication messages
*   Engagement card labels (status, dates, location, capacity)
*   Filter & search labels
*   Profile management labels
*   SVG icon content (location, calendar, search, virtual engagement icons)

#### 2.2.6 Web Roles (3)

| Role | Purpose |
| --- | --- |
| Anonymous Users | Public browsing — can view published opportunities |
| Authenticated Users | Logged-in volunteers — can apply, manage profile, track engagements |
| Administrators | Full data access |

#### 2.2.7 Static Assets

| Type | Files |
| --- | --- |
| CSS | `bootstrap.min.css`, `portalbasictheme.css`, `theme.css`, `profile.css`, `volEngageTweaks.css` |
| JavaScript | `profile.js` |
| Images | `Logo.png`, `homeHero.png`, `About-Us.png`, `Analytics.png`, etc. |
| Plugin | `jplist` (sorting/filtering library) |

#### 2.2.8 Theming (Light/Dark Mode)

The portal supports **light and dark mode** with a unified experience across the React SPA and Liquid-rendered pages (login, registration, profile security).

**SPA theming** (React):
- `ThemeProvider` in `src/context/ThemeContext.tsx` wraps the app in `FluentProvider`
- Toggles between Fluent UI `webLightTheme` and `webDarkTheme`
- User preference stored in `localStorage` key: **`ve-theme`** (values: `'light'` | `'dark'`)
- `ThemeToggle` component in the header allows switching

**Liquid page theming** (login, registration, profile security):
- The Header web template (`header/Header.webtemplate.source.html`) injects a blocking `<script>` that reads `localStorage('ve-theme')` and adds CSS class **`ve-dark`** to `<html>` before paint — prevents flash of wrong theme
- Dark mode CSS overrides live in `theme.css` and `profile.css`, scoped under `html.ve-dark`
- All dark mode colors are mapped 1:1 to Fluent UI `webDarkTheme` tokens:

| CSS Property | Light Value | Dark Value | Fluent Token |
| --- | --- | --- | --- |
| Page background | `#ffffff` | `#292929` | `colorNeutralBackground1` |
| Text | `#000000` | `#ffffff` | `colorNeutralForeground1` |
| Secondary text | `#333333` | `#d6d6d6` | `colorNeutralForeground2` |
| Links | `#09517b` | `#479ef5` | `colorBrandForegroundLink` |
| Link hover | `#09517b` | `#62abf5` | `colorBrandForegroundLinkHover` |
| Primary button | `#09517b` | `#115ea3` | `colorBrandBackground` |
| Input background | `#ffffff` | `#1f1f1f` | `colorNeutralBackground2` |
| Borders | `#d1d1d1` | `#666666` | `colorNeutralStroke1` |
| Hover surface | `#f2f2f2` | `#383838` | `colorSubtleBackgroundHover` |
| Disabled text | — | `#5c5c5c` | `colorNeutralForegroundDisabled` |

**Key design decisions:**
- Dark class is `ve-dark` (namespaced to avoid conflicts with Bootstrap `.dark` utilities)
- Auth pages (login, registration, account management) remain Liquid-rendered — they use Power Pages' built-in server-side auth middleware (CSRF, OAuth, throttling). Only visual theming is synced
- `portalbasictheme.css` is auto-generated by Power Pages Theme panel — we override it with specificity via `html.ve-dark` selectors rather than modifying it directly

#### 2.2.9 Localization

| Locale | LCID | Delivery |
| --- | --- | --- |
| English | 1033 | `Portal/` directory + `ConfigData/1033/` |
| French | 1036 | `Portal-French/` directory + `ConfigData/1036/` |
Localization is achieved by deploying a **complete duplicate portal** per language. Content snippets, web pages, and templates are cloned entirely.

### 2.3 Package Deployer

| File | Purpose |
| --- | --- |
| `PackageImportExtension.cs` | Custom import handler — detects language, maps to correct portal website ID, handles upgrade scenarios |
| `PortalUtils.cs` | Utility for detecting existing portal installations, querying site settings |
| `ImportConfig.xml` / `ImportConfig.Release.xml` | Solution import ordering and config data loading |
| `manifest.ppkg.json` | Power Package manifest for AppSource deployment |

### 2.4 Anchor Solution

`VolunteerEngagementAnchor` (v1.0.3.0) — an empty base solution deployed first to establish dependency layering. Contains no root components, no entities, no code.

### 2.5 CI/CD

| Pipeline | Purpose |
| --- | --- |
| Public repository validation | npm build, lint, and test commands under `Portal-EDM` |
| `VE-Deploy.yml` | Deployment to 3 TSI environments (Build/Test/Regression-2) |

3. VolunteerManagement — Components Required by VE
--------------------------------------------------

VolunteerEngagement portal **queries the following VM entities at runtime** via FetchXML in Liquid templates. Without these entities, the portal's core pages (Home, Opportunities, Engagement Details, My Engagements) would be completely non-functional.

### 3.1 Required VM Entities (6)

| Entity | Schema Name | Used By Portal For |
| --- | --- | --- |
| **Public Engagement Opportunity** | `msnfp_publicengagementopportunity` | Home page cards, Opportunities listing, Engagement Details — the published version of an engagement opportunity visible to the public |
| **Engagement Opportunity** | `msnfp_engagementopportunity` | Engagement Details (linked from public record), My Engagements — the internal/full entity with all configuration |
| **Engagement Opportunity Schedule** | `msnfp_engagementopportunityschedule` | Engagement Details — shows available shifts/dates with capacity |
| **Participation** | `msnfp_participation` | Apply/signup action, My Engagements dashboard — tracks a volunteer's application/registration |
| **Participation Schedule** | `msnfp_participationschedule` | My Engagements — tracks which specific shifts a volunteer is assigned to |
| **Engagement Opportunity Participant Qualification** | `msnfp_engagementopportunityparticipantqual` | Engagement Details — shows required qualifications for an opportunity |

### 3.2 Required VM Supporting Entities (1)

| Entity | Schema Name | Used By Portal For |
| --- | --- | --- |
| **Preference Type** | `msnfp_preferencetype` | Profile — lookup table for preference categories |

### 3.3 Required VM Plugins (Relevant to Portal Workflows)

The following VM plugins fire server-side when the portal creates/updates records:
| Plugin | Trigger | Portal Relevance |
| --- | --- | --- |
| `ParticipationOnPreCreate` | Volunteer applies via portal | Validates contact is active, opportunity not closed; auto-sets status (Approved if auto-approve on, else NeedsReview) |
| `ParticipationOnPostCreate` | After volunteer applies | Auto-creates participation schedule; sends signup confirmation email; updates opportunity counts |
| `ParticipationOnPostUpdate` | Status changes (approval, cancellation) | On approval → creates shift assignment, sends approval email; on cancellation → cancels shifts, adjusts hours |
| `ParticipationScheduleOnPreCreate` | Shift assignment created | Validates schedule data, sets defaults |
| `ParticipationScheduleOnPostUpdateAndCreate` | Shift created/updated | Updates aggregated hours on participation and contact records |

### 3.4 Required VM Workflows (2)

| Workflow | Purpose | Portal Relevance |
| --- | --- | --- |
| `MaxParticipantsCheck` | Validates opportunity hasn't exceeded max capacity | Prevents over-booking when volunteers apply |
| `VolunteerDefaultsYes` | Sets default volunteer flag values | Ensures correct defaults on new records |

### 3.5 Required VM Environment Variables (2)

| Variable | Purpose |
| --- | --- |
| `msnfp_EnableVolunteerEmailing` | Controls whether confirmation/notification emails are actually sent |
| `msnfp_VolunteerEmailBCCLimit` | Max BCC recipients per email before splitting into multiple emails |

### 3.6 VM Components NOT Required by VE Portal

The following VM components serve the model-driven staff app only and are not triggered by portal interactions:
| Component Type | Components | Purpose |
| --- | --- | --- |
| **Model-driven app** | NonprofitVolunteerManagement app + sitemap | Staff UI for managing opportunities and volunteers |
| **Entities** | `msnfp_group`, `msnfp_groupmembership`, `msnfp_message`, `msnfp_onboardingprocessstage`, `msnfp_onboardingprocessstep`, `msnfp_onboardingtask`, `msnfp_getstarted`, `msnfp_EngagementOpportunitySetting`, `msnfp_EngagementOpportunityPreference`, `msnfp_qualificationstage`, `msnfp_qualificationstep` | Groups, messaging, onboarding workflows, settings |
| **PCF controls** | EngagementOpportunitySummary, GetStarted, OnboardingStages, SendMessages | Staff dashboards and utilities |
| **WebResources** | 11 TypeScript form handlers, SVG icons | Staff form UI behaviors |
| **Plugins** | 19 other plugins (engagement opportunity CRUD, group membership, message, qualification stage, onboarding) | Staff-side automation |
| **Security roles** | Volunteer Manager, Send Email as Another User | Staff permissions |

4. Business Functionality
-------------------------

### 4.1 Volunteer Journey (Portal — VE Solution)

    ┌─────────────────────────────────────────────────────────────────┐
    │                     VOLUNTEER SELF-SERVICE                      │
    ├─────────────────────────────────────────────────────────────────┤
    │                                                                 │
    │  1. DISCOVER                                                    │
    │     • Browse Home page with search box and filter sidebar       │
    │     • Filter by: location, date range, preferences,             │
    │       qualifications                                            │
    │     • View engagement opportunity cards (title, date, location, │
    │       spots available)                                          │
    │                                                                 │
    │  2. EXPLORE                                                     │
    │     • Click into Engagement Details page                        │
    │     • View: description, schedule/shifts, location type         │
    │       (on-site/remote/hybrid), required qualifications,         │
    │       available spots per shift                                 │
    │                                                                 │
    │  3. APPLY                                                       │
    │     • One-click apply → creates Participation record            │
    │     • System auto-approves (if configured) or sets to           │
    │       "Needs Review"                                            │
    │     • Confirmation displayed on Success page                    │
    │                                                                 │
    │  4. TRACK                                                       │
    │     • My Engagements dashboard shows:                           │
    │       - Upcoming engagements with shift details                 │
    │       - Completed engagements with hours logged                 │
    │       - Application status (Applied, Accepted, Dismissed, etc.) │
    │                                                                 │
    │  5. MANAGE PROFILE                                              │
    │     • Edit personal info (name, email, phone)                   │
    │     • Set availability windows (date ranges + working days)     │
    │     • Add preferences (areas of interest → matched to opps)    │
    │     • Add qualifications (certifications with dates)            │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
    

### 4.2 Staff Journey (Model-Driven App — VM Solution)

    ┌─────────────────────────────────────────────────────────────────┐
    │                    STAFF ADMINISTRATION                          │
    ├─────────────────────────────────────────────────────────────────┤
    │                                                                 │
    │  1. CREATE OPPORTUNITY                                          │
    │     • Set title, description, type, location (on-site/remote)   │
    │     • Configure scheduling: single-date, multi-day, or shifts   │
    │     • Set min/max participants per shift                        │
    │     • Define required qualifications                            │
    │     • Enable/disable auto-approval                              │
    │                                                                 │
    │  2. PUBLISH                                                     │
    │     • Publish to web → creates Public Engagement Opportunity    │
    │       record → appears on portal                                │
    │     • Unpublish → removes from public view                      │
    │                                                                 │
    │  3. REVIEW APPLICATIONS                                         │
    │     • View participants with "Needs Review" status              │
    │     • Approve → system auto-creates shift assignment,           │
    │       sends approval email                                      │
    │     • Dismiss → sends notification                              │
    │                                                                 │
    │  4. MANAGE ONBOARDING (optional)                                │
    │     • Assign multi-stage qualification process                  │
    │       (orientation → training → certification)                  │
    │     • System auto-creates staff tasks per stage                 │
    │     • Track completion, due dates, blockers                     │
    │                                                                 │
    │  5. TRACK & REPORT                                              │
    │     • View Engagement Opportunity Summary (PCF control):        │
    │       per-shift fill rates, review queue, no-shows              │
    │     • Aggregate volunteer hours per contact                     │
    │     • Groups: organize volunteers by teams/divisions            │
    │     • Messaging: bulk-send emails to participants               │
    │                                                                 │
    │  6. CLOSE                                                       │
    │     • Mark opportunity complete/closed/cancelled                │
    │     • Cancellation cascades: cancels all participation          │
    │       schedules                                                 │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
    

### 4.3 Automation Summary

| Automation | Trigger | Result | Owner |
| --- | --- | --- | --- |
| Auto-approval | Volunteer applies on portal | Status set to "Approved" if opportunity has auto-approve enabled | VM plugin |
| Shift auto-assignment | Participation approved | Participation Schedule record created for the volunteer | VM plugin |
| Signup email | Volunteer applies | Confirmation email sent | VM plugin |
| Approval email | Staff approves application | "You're approved" email with shift details | VM plugin |
| Completion email | First hours logged | "Thank you" email sent | VM plugin |
| Max capacity check | Volunteer applies | Blocks application if opportunity is full | VM workflow |
| Cascade cancellation | Opportunity/shift deactivated | All child participation schedules cancelled | VM plugin |
| Onboarding auto-creation | Qualification assigned (onboarding type) | Multi-stage process with activities auto-created | VM plugin |
| Hours aggregation | Participation schedule updated | Total hours rolled up to participation and contact records | VM plugin |

### 4.4 Data Captured Per Volunteer

| Data | Entity | Entry Point |
| --- | --- | --- |
| Personal info (name, email, phone) | Contact | Portal Profile page |
| Availability windows (date range + working days) | `msnfp_availability` | Portal Profile - Availability page |
| Interests/preferences | `msnfp_preference` → `msnfp_preferencetype` | Portal Profile - Preferences page |
| Certifications/skills | `msnfp_qualification` → `msnfp_qualificationtype` | Portal Profile - Qualifications page |
| Applications | `msnfp_participation` | Portal Engagement Details page (Apply) |
| Shift assignments | `msnfp_participationschedule` | Auto-created by system on approval |
| Total volunteer hours | Contact (rollup field) | Auto-aggregated by system |

5. Dependency Chain
-------------------

                        ┌─────────────────────────┐
                        │    NonprofitCore         │
                        │    (v3.0.3.2+)           │
                        │                         │
                        │  Provides:              │
                        │  • msnfp_availability   │
                        │  • msnfp_preference     │
                        │  • msnfp_qualification  │
                        │  • msnfp_qualification  │
                        │    type                 │
                        │  • Contact extensions   │
                        └──────────┬──────────────┘
                                   │
                  ┌────────────────┴────────────────┐
                  │                                 │
                  ▼                                 ▼
    ┌──────────────────────┐          ┌──────────────────────────┐
    │ VolunteerEngagement  │          │  VolunteerManagement     │
    │ Anchor (v1.0.3.0)    │          │  (v1.0.3.x)              │
    │                      │          │                          │
    │ Empty base solution  │          │  Provides:               │
    │ for layering         │          │  • 24 entities           │
    └──────────┬───────────┘          │  • 24 plugins            │
               │                      │  • 4 PCF controls        │
               ▼                      │  • 2 workflows           │
    ┌──────────────────────┐          │  • 2 security roles      │
    │ VolunteerEngagement  │          │  • 11 form handlers      │
    │ (v1.0.0.0)           │          │  • 17 global option sets │
    │                      │          │  • Model-driven app      │
    │ Contains:            │          └──────────┬───────────────┘
    │ • Portal (EN/FR)     │                     │
    │ • 5 entity form/view │                     │
    │   customizations     │                     │
    │ • Package deployer   │                     │
    │                      │                     │
    │ DEPENDS ON:          │                     │
    │ • NonprofitCore      │◄────────────────────┘
    │   (DECLARED)         │    Portal runtime queries
    │ • VolunteerMgmt      │    6 VM entities
    │   (UNDECLARED!)      │    (IMPLICIT dependency)
    └──────────────────────┘
    

### Import Order (required)

1.  NonprofitCore
2.  VolunteerEngagementAnchor
3.  VolunteerManagement
4.  VolunteerEngagement

6. Customer Pricing Model
-------------------------

### 6.1 Required Licenses

| License | Purpose | Required? |
| --- | --- | --- |
| **Power Apps (per-app or per-user)** | Staff access to Volunteer Management model-driven app | Yes — for every staff user (volunteer coordinators) |
| **Power Pages authenticated user capacity** | Volunteer self-service portal login | Yes — for every volunteer who signs in |
| **Power Pages anonymous user capacity** | Public opportunity browsing (no login needed) | Optional — for public browsing volume |
| **Dataverse capacity** | Data storage (volunteers, opportunities, participations) | Included with Power Apps license (base capacity); overage purchased separately |
| **Microsoft 365** | Email notifications (Exchange Online) | Usually already owned |

### 6.2 Pricing Estimates

#### Power Apps (Staff)

| Plan | Price | Notes |
| --- | --- | --- |
| Per-app plan | ~$5/user/app/month | Most cost-effective for small teams (1 app = Volunteer Management) |
| Per-user plan | ~$20/user/month | Unlimited apps; better if staff uses multiple Power Apps |

#### Power Pages (Volunteers)

| Capacity | Price | Notes |
| --- | --- | --- |
| Authenticated users | ~$200/100 users/month pack | Each volunteer who logs in consumes capacity |
| Anonymous users | ~$75/500 page views/month | Public browsing without sign-in |

#### Dataverse Storage

| Type | Included | Overage |
| --- | --- | --- |
| Database | 1 GB per tenant + per-license | ~$40/GB/month |
| File | 2 GB per tenant + per-license | ~$2.50/GB/month |
| Log | 2 GB per tenant + per-license | ~$10/GB/month |

### 6.3 Estimated Total Cost by Organization Size

| Scenario | Staff | Active Volunteers | Estimated Monthly Cost |
| --- | --- | --- | --- |
| **Small nonprofit** | 2 coordinators | 50 volunteers | ~$210–310 |
|  | Power Apps: 2 × $5 = $10 | Power Pages: 1 pack = $200 |  |
| **Medium nonprofit** | 5 coordinators | 300 volunteers | ~$725–1,100 |
|  | Power Apps: 5 × $5 = $25 | Power Pages: 3 packs = $600 | + possible Dataverse overage |
| **Large nonprofit** | 10 coordinators | 1,000 volunteers | ~$2,100–2,600 |
|  | Power Apps: 10 × $5 = $50 | Power Pages: 10 packs = $2,000 | + Dataverse overage |
| **Enterprise nonprofit** | 20 coordinators | 5,000 volunteers | ~$10,200–11,000 |
|  | Power Apps: 20 × $5 = $100 | Power Pages: 50 packs = $10,000 | + Dataverse overage |

> **Key insight:** Power Pages authenticated-user capacity is the dominant cost driver, comprising ~90%+ of total cost at scale. The per-volunteer cost decreases marginally with volume but remains significant.

### 6.4 What's Free (No Additional Cost)

| Component | Cost | Why |
| --- | --- | --- |
| Dataverse plugins (VM) | $0 | Execute within Dataverse platform — no compute billing |
| Email notifications | $0 | Uses existing Exchange Online (included in M365) |
| Azure infrastructure | $0 | No Azure Functions, APIs, or hosted services required |
| Solution installation | $0 | AppSource deployment — free to install |
| Updates | $0 | Solution updates delivered via managed solution import |

7. Known Issues & Technical Debt
--------------------------------

| Issue | Impact | Location |
| --- | --- | --- |
| **Undeclared VM dependency** | VE Solution.xml does not list VolunteerManagement as a dependency; portal will fail at runtime if VM is not installed | `Solution.xml` MissingDependencies |
| **Duplicate portal for localization** | Entire portal cloned for French (Portal-French/); every change must be made twice | `Portal/` vs `Portal-French/` |
| **Legacy Liquid templates** | 62+ templates with FetchXML embedded in HTML; no type safety, no component reuse | `Portal/web-templates/` |
| **Raw JavaScript in templates** | Business logic in `msve_engagementcards-js` and other templates; no build pipeline, no linting | `Portal/web-templates/msve_*` |
| **220+ content snippets** | Every UI label is a database record; redeployment required for text changes | `Portal/content-snippets/` |
| **Bootstrap 3-era CSS** | Legacy styling stack (`bootstrap.min.css` + custom overrides); not aligned with Fluent UI | `Portal/web-files/` |
| **No test coverage for portal** | No automated tests for portal templates, forms, or permissions | — |
| **Two deprecated XAML workflows** | `MaxParticipantsCheck` and `VolunteerDefaultsYes` use XAML format (deprecated by Microsoft) | VM: `Solution/Workflows/` |
| **VE version stale** | VE is at v1.0.0.0 while VM is at v1.0.3.x; suggests VE has not been actively versioned | `Solution.xml` |
| **Legacy portal package deployment** | Older portal provisioning relied on large XML data files per locale; the public source now uses the `Portal-EDM` code-site workflow | Legacy portal package |