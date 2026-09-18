# Resend verification email: repro and fix

Date: 2026-09-18
Branch: `fix/resend-verification-email` (off `main` at `c8168a0`)
Firebase project used: `writingchallengetest` (the local `frontend/.env`). Nothing touched production.

## The complaint

"A user says they never got the verification email and there's no way to get another one."

## How it was tested

A Playwright script drove Chrome against `npm run dev` on port 5173 and walked one journey:
sign up, look for a resend, open the verify page, sign in unverified, look for a resend.
Every call the browser made to Firebase's `accounts:sendOobCode` endpoint was captured, so
"Firebase accepted a verification send" is measured, not inferred. Whether a session was
left behind was read from Firebase's IndexedDB persistence after each step.

Throwaway accounts (`resend-test-*@example.com`) were created in the test project and
deleted afterwards with the Admin SDK, including their Firestore `users` docs.

## Results before the fix

| Step | Observed |
| --- | --- |
| T1 Open `/auth/verify-email` signed out | Redirected to `/auth/sign-up`. No resend button. |
| T2 Sign up | Firebase accepted 1 send (HTTP 200). Success screen buttons: `Go to sign in` only. No session afterwards. |
| T3 Resend from sign-up screen | Skipped: no button exists. |
| T4 Open `/auth/verify-email` after sign-up | Redirected to `/auth/sign-up`. No resend button. |
| T5 Sign in unverified | Error text shown, no resend button, no session. |
| T6 Resend from sign-in | Skipped: no button exists. |
| T7 Resend from verify page signed out | Skipped: no form exists. |

Total verification sends Firebase received: 1 (the sign-up one). There was no path to a second.

Root cause: `resendVerificationEmail` required `auth.currentUser`, but both sign-up and an
unverified sign-in sign the user out on purpose. The one page with a resend button also
redirected away whenever `auth.currentUser` was null, so it was unreachable. The verification
email's continue URL pointed at that same page, so clicking the email link also bounced to sign-up.

## The fix

- `auth.service.ts`: `resendVerificationEmail` accepts optional `{ email, password }`. With
  credentials it signs in, sends, and signs back out in a `finally`, so no unverified session
  survives. Firebase's `auth/too-many-requests` and bad-credential codes map to plain messages.
  Sign-in throws an error with code `auth/email-not-verified` instead of relying on message text.
  Verified sign-in also flips the Firestore `emailVerified` flag, which nothing set before.
- `SignInPage.tsx`: the unverified error now includes a "Resend verification email" button that
  uses the credentials already in the form.
- `SignUpForm.tsx`: the success screen has a "Didn't get it? Resend verification email" button.
- `EmailVerificationPage.tsx`: no longer redirects when signed out. It explains that clicking
  the email link means you're verified, offers "Go to sign in", and has a small email/password
  form to resend. Initial auth state is taken from the first auth event, not `auth.currentUser`.
- `ServerWakeUpWrapper.jsx`: `/auth/verify-email` added to the pages that don't need the backend.
  Without this, the page was replaced by the "Waking Up Server" screen after 2 seconds whenever
  the backend was asleep, which is exactly when someone clicks an email link.

## Results after the fix

Run with a 75 second pause before each resend, because Firebase throttles repeat sends to the
same address for a short window after a send.

| Step | Observed |
| --- | --- |
| T1 Open `/auth/verify-email` signed out | Stayed on `/auth/verify-email`. Resend form visible. |
| T2 Sign up | Firebase accepted 1 send (200). Buttons: `Go to sign in`, `Didn't get it? Resend verification email`. No session afterwards. |
| T3 Resend from sign-up screen | Firebase accepted send #2 (200). "Verification email sent!" shown. No session afterwards. |
| T4 Open `/auth/verify-email` after sign-up | Stayed on the page. Resend form visible. |
| T5 Sign in unverified | Error text shown with a `Resend verification email` button. No session. |
| T6 Resend from sign-in | Firebase accepted send #3 (200). No session afterwards. |
| T7 Resend from verify page signed out | Firebase accepted send #4 (200). "Verification email sent!" shown. No session afterwards. |

Total verification sends Firebase received: 4, one per entry point.

Rate-limit path, from an earlier run without the pause: Firebase answered sends #2 and #3
with `TOO_MANY_ATTEMPTS_TRY_LATER` (HTTP 400). The UI showed "Too many attempts. Please wait
a few minutes before requesting another email." rather than a raw Firebase error.

## Real-address run

Same script, same 75 second pauses, with `tdzik@villanova.edu` instead of a throwaway address.
All seven steps matched the "after" table above. Firebase accepted four verification sends
for that address (HTTP 200 each): sign-up, sign-up screen resend, sign-in resend, verify-page
resend. No session was left behind after any step. The account was left in place in the test
project so the emails' links can be clicked and the sign-in completed.

Delivery confirmed by the recipient: all four arrived, all four in the spam folder.
That is the likely cause of the original "never got the email" report. The sender is
Firebase's default `noreply@<project>.firebaseapp.com`, which Villanova's mail filter
distrusts. Fixing that is a console setting, not code: Authentication > Templates >
customize the sender domain, then add the SPF and DKIM records it gives you to DNS.
It must be done separately for the test and production projects.

## What was verified, assumed, skipped

- Verified: every row above, from browser automation and captured network responses.
- Verified: `vite build` succeeds. The project has no `tsc` or ESLint coverage of `src/auth`,
  so there is no type check beyond esbuild's transform.
- Assumed: a Firebase 200 on `sendOobCode` means the email is on its way. Delivery to a real
  inbox was not checked because the test addresses were `@example.com`. To see delivery, run
  the journey once with a real address.
- Skipped: the "signed in but unverified" branch of the verify page. The app never leaves a user
  in that state, so it can't be reached from the UI. The code path is unchanged from before.

## Re-running

```
cd frontend && npm run dev
# in another shell, with playwright installed somewhere outside the repo:
RESEND_WAIT_MS=75000 node resend-test.js after
```

The script lives outside the repo (it needs Playwright, which the project doesn't depend on).
Ask for it if you want it checked in.
