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

Production evaluations use a durable background queue and an account-scoped submission key. Feedback can finish after you leave the screen; History shows queued work and completed results. Failed or timed-out requests keep their submission key and answers. Evaluation writes are never retried automatically.

History loads 50 sessions at a time and offers older pages. Summary cards use server-calculated lifetime counts and scores; distribution/trend charts describe the loaded sample.

Browser login keeps the refresh credential in a Secure, HttpOnly cookie through the same-origin API proxy. Access credentials renew before expiry; refresh credentials are never stored in localStorage. Existing mobile clients retain their original response contract. `/reset-password` supports emailed recovery codes; the Supabase recovery email template must include `{{ .Token }}` and working email delivery.

`npm run build:site` builds a Sites Worker with the existing React app and an API proxy to Azure. `npm run build` keeps the Vercel/Vite static build; `vercel.json` supplies its API proxy. `VITE_BACKGROUND_EVALUATIONS=false` explicitly disables queue integration for a staged rollout.

## Review and accessibility

Results start with a strength, an improvement focus, and a suggested next practice step. Editors have accessible labels; review dialogs support focus containment, Escape to close, and focus restoration. Reduced-motion preferences are respected.
