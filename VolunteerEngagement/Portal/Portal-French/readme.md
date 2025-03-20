# This file includes French portal specific file changes that is different from English version.
French portal has regenerated guids for the records, otherwise it would conflict if portals with different translations deployed to the same environment.

Values in the following files have changed after merge-translation.

## website.yml
- adx_website_language: 1036

## .portalconfig\portallanguage.yml
- adx_displayname: French
- adx_languagecode: fr-FR
- adx_lcid: 1036
- adx_name: French
- adx_systemlanguage: 1036

## websitelanguage.yml
- adx_name: French - France

## FetchXML in following files have changed for Date format support from {{now}} to "{{now | date: "MM-dd-yy"}}", othwerwise it breaks query at runtime.
- msve_engagement-engagementschedules-fetch\MSVE_Engagement-EngagementSchedules-Fetch.webtemplate.source.html
- msve_engagement-fetch\MSVE_Engagement-Fetch.webtemplate.source.html
- msve_engagements-participationschedules-fetch\MSVE_Engagements-ParticipationSchedules-Fetch.webtemplate.source.html
- msve_myengagements-fetch\MSVE_MyEngagements-Fetch.webtemplate.source.html
- msve_publicengagements-fetch\MSVE_PublicEngagements-Fetch.webtemplate.source.html
