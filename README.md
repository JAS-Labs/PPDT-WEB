# PPDT-WEB

React and Vite web app for PPDT, WAT, TAT, SDT, and SCT practice.

## Local development

- Install dependencies: `npm ci`
- Start the app: `npm run dev` (port 3000)
- Run checks: `npm test -- --maxWorkers=2`
- Build: `npm run build`

Development and preview requests to `/api` are proxied to the production backend. Automated tests mock API responses and do not create production attempts.

## Practice recovery

Unfinished sessions are saved in browser session storage, separately for each account and test. Return to the same test in the same tab to restore its answers, prompt/image, and progress. Drafts expire after 24 hours and are removed after successful submission or explicit discard. Closing the tab or disabling browser storage can prevent recovery.

Failed evaluations preserve answers and offer manual retry. After a timeout, check history before retrying: the backend may have saved the first request, and it does not provide a client idempotency key.

## Review and accessibility

Results start with a strength, an improvement focus, and a suggested next practice step. Editors have accessible labels; review dialogs support focus containment, Escape to close, and focus restoration. Reduced-motion preferences are respected.
