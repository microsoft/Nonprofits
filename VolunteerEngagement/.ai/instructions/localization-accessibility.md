# Localization and accessibility instructions

Use these instructions for every migrated customization and every new SPA feature.

## Localization baseline

The initial migration output is English-only. However, the site must be prepared for localization in the same spirit as the new Volunteer Engagement SPA.

## Localization rules

- Keep user-facing text centralized in the SPA localization-ready pattern.
- Do not hard-code new visible strings throughout components when a translatable string mechanism exists.
- Preserve source-site English content that remains relevant.
- When using exported localized material, treat non-English content as reference only unless the user asks to produce localized output.
- Keep labels, aria labels, validation messages, empty states, error messages, button text, and status text localization-ready.
- Avoid concatenating translated fragments in a way that blocks natural translation later.

## Legacy localization references

Use the downloaded site export and any provided localization files to understand old language coverage and string intent.

- Localized pages, templates, snippets, and web files in the downloaded site export.
- Provided localization resource files or repositories.
- Environment exports for additional site languages, when the source site uses more than one language.

Do not duplicate the old full-portal-per-language implementation unless explicitly requested.

## Accessibility standard

Target WCAG AA. Prefer the current Microsoft accessibility bar where it is stricter.

## Accessibility rules

- Use semantic HTML and Fluent UI v9 components.
- Maintain logical heading order.
- Provide accessible names for icon-only buttons and controls.
- Ensure form fields have labels and error messages.
- Ensure dialogs trap focus and return focus appropriately.
- Ensure keyboard users can complete every workflow.
- Ensure visible focus indicators are present.
- Ensure color contrast meets WCAG AA.
- Do not rely on color alone to communicate status.
- Provide loading, empty, and error states that are announced or understandable.
- Ensure responsive layouts do not overlap, clip, or hide required content.

## Required checks

For every migrated feature, validate:

- Keyboard-only navigation.
- Screen reader-friendly labels and structure.
- Focus order and focus visibility.
- Color contrast in light and dark themes if both are supported.
- Mobile layout at narrow widths.
- Error and validation message behavior.
- No inaccessible custom controls replacing native/Fluent controls unnecessarily.

## Definition of done for UI changes

A migrated UI customization is not complete until:

- It uses localization-ready text.
- It works with keyboard navigation.
- It has visible focus states.
- It has accessible labels and statuses.
- It passes browser smoke testing on desktop and mobile widths.
- It does not regress existing SPA accessibility patterns.
