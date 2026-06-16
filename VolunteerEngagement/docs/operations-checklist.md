# Operations Checklist

Use this checklist for go-live and ongoing support of the Volunteer Engagement site.

## Go-live

- [ ] Site visibility is set to public. See [Site visibility in Power Pages](https://learn.microsoft.com/en-us/power-pages/security/site-visibility).
- [ ] Custom domain and certificate are configured if needed. See [Add a custom domain name](https://learn.microsoft.com/en-us/power-pages/admin/add-custom-domain).
- [ ] Run Site Checker and resolve reported issues. See [Run Site Checker](https://learn.microsoft.com/en-us/power-pages/admin/site-checker).

## Caching

- Power Pages can keep serving cached JS and CSS after `pac pages upload-code-site` reports success.
- Verify the server has the new asset with `fetch('/assets/index.js', { cache: 'no-store' })` in the browser console, or wait for the cache TTL.
- For details, see [How server-side caching works in Power Pages](https://learn.microsoft.com/en-us/power-pages/admin/clear-server-side-cache) and [Content Delivery Network](https://learn.microsoft.com/en-us/power-pages/configure/configure-cdn).

## Support tasks

- [ ] Restart the site if configuration changes don't appear: `npm run site:restart`.
- [ ] Confirm `.powerpages-site/website.yml` points to the intended website record.
- [ ] If `/assets/*.js` or `/assets/*.css` returns 404 after upload, confirm the runtime is bound to the same website record and Home root that was uploaded.

For more troubleshooting, see [Portal-EDM/README.md](../Portal-EDM/README.md#troubleshooting).
