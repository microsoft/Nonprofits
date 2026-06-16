Volunteer Engagement — Dependency on Volunteer Management
==========================================================

1. Runtime Dependency
-----------------------------

This public source folder does not include the legacy managed solution package or Package Deployer project. The deployed Power Pages site requires Common Data Model for Nonprofits and Volunteer Management to be installed and active in the target environment before the SPA can function correctly.

2. Portal → VM Entities
--------------------------------------------

The portal **cannot function without VM**. The 65 web templates query 7 VM-owned entities via FetchXML and Web API:

| VM Entity | Used by portal for |
|---|---|
| `msnfp_publicengagementopportunity` | Home page, opportunity listings, engagement details |
| `msnfp_engagementopportunity` | Engagement details, my engagements |
| `msnfp_engagementopportunityschedule` | Available shifts/dates |
| `msnfp_participation` | Volunteer signup, my engagements dashboard |
| `msnfp_participationschedule` | Shift assignments |
| `msnfp_engagementopportunityparticipantqual` | Required qualifications for opportunities |
| `msnfp_preferencetype` | Preference category lookups on profile |

3. Plugin Dependency
--------------------

When volunteers interact through the portal (apply, sign up for shifts), VM plugins fire server-side:

| VM Plugin | Fires when |
|---|---|
| `ParticipationOnPreCreate` | Volunteer applies — validates contact, sets status |
| `ParticipationOnPostCreate` | After apply — creates shift assignment, sends email |
| `ParticipationOnPostUpdate` | Status change — handles approval/cancellation |
| `ParticipationScheduleOnPreCreate` | Shift assignment created — validates, sets defaults |
| `ParticipationScheduleOnPostUpdateAndCreate` | Shift created/updated — aggregates hours |

4. Workflow Dependency
----------------------

| VM Workflow | Portal relevance |
|---|---|
| `MaxParticipantsCheck` | Prevents over-booking when volunteers apply |
| `VolunteerDefaultsYes` | Sets default volunteer flag on new contact records |

5. Environment Variable Dependency
-----------------------------------

| VM Environment Variable | Controls |
|---|---|
| `msnfp_EnableVolunteerEmailing` | Whether confirmation emails are sent on signup |
| `msnfp_VolunteerEmailBCCLimit` | Max BCC per email before splitting |

6. Dependency Type
------------------

This dependency is **implicit** — it is not declared in VE's `Solution.xml` as a solution dependency. The runtime dependency on VM entities is enforced only by:

- The FetchXML queries in the Liquid templates
- The Web API calls in `msve_engagementdetails-js`
- The import ordering in `ImportConfig.Release.xml`
