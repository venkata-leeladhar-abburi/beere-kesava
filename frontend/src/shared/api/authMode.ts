/**
 * How the browser holds the session.
 *
 * "cookie": the backend sets an httpOnly cookie on login and page script
 * never sees the token, so an XSS bug cannot steal a session. The browser
 * only sends that cookie when the app and the API are on the same site
 * (e.g. app.example.com + api.example.com), so turn this on only once the
 * custom domains are live (docs/DEPLOY_RUNBOOK.md).
 *
 * Anything else: the token is kept in localStorage and sent as a Bearer
 * header, which works across any two domains.
 */
export const COOKIE_AUTH = import.meta.env.VITE_AUTH_MODE === "cookie";
