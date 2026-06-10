# Authentication migration instructions

Use these instructions when migrating sign-in behavior from a legacy Volunteer Engagement site to the new SPA site.

## Known baseline

Microsoft Entra sign-in and local username/password sign-in have been observed to work out of the box in the current migration context. Other authentication providers are not confirmed and must be validated or reconfigured deliberately.

## Default rule

Do not blindly copy authentication configuration from the legacy site. Authentication settings are environment-specific and security-sensitive.

## Inventory

For the legacy site, identify:

- Enabled identity providers.
- Local username/password sign-in configuration.
- Microsoft Entra ID configuration.
- External providers such as Azure AD B2C, External ID, OpenID Connect, SAML, or social providers.
- Invitation redemption behavior.
- Registration behavior.
- Password reset behavior.
- Account linking behavior.
- Profile and account management pages.
- Authentication-related site settings.
- Web roles assigned after sign-in.

## Migration guidance

### Microsoft Entra ID

- Validate sign-in on the new site.
- Confirm the signed-in contact is the expected Dataverse contact.
- Confirm authenticated web role assignment.
- Confirm access to profile, my engagements, and apply/register flows.

### Local username/password sign-in

- Validate sign-in, sign-out, registration, password reset, and profile security flows.
- Confirm legacy contacts can sign in where supported by the platform.
- Confirm web roles are associated correctly after sign-in.

### Other providers

Treat all other providers as unverified until tested:

- Reconfigure provider settings in the target site rather than copying settings blindly.
- Validate callback and redirect URLs.
- Validate contact matching/account linking.
- Validate web role assignment.
- Validate sign-out behavior.
- Record provider-specific manual steps.

## Web role reassociation

Web role reassociation is required when the new site has different web role records than the legacy site.

Validate:

- Anonymous users role is present and marked correctly.
- Authenticated users role is present and marked correctly.
- Administrators role is present where needed.
- Existing contacts that should have role membership are associated with the target site's roles.
- Table permissions reference the target site's web roles.

## Security review points

Require explicit review for:

- Any change to anonymous access.
- Any change to authenticated web role assignment.
- Any copied authentication-related site setting.
- Any Web API field exposure needed for auth or profile flows.
- Any external provider secret, client ID, authority, callback URL, or metadata endpoint. Use placeholders in documentation and never store secrets in source files.

## Validation checklist

- Anonymous user can browse public opportunities only.
- Authenticated user can apply/register and view personal engagement data.
- User cannot access another contact's private data.
- Sign out clears the expected session state.
- Sign-in pages remain visually consistent with the SPA theme where applicable.
- Authentication flows work after deployment, not only in local preview.
