# ForgeRock AM Journey Scripts

A curated collection of JavaScript scripts for **ForgeRock AM / PingAM authentication tree journeys** (Scripted Decision nodes). Each script is a drop-in starting point for common production patterns: login security, adaptive risk, registration validation, OTP cost control, and journey utilities.

Written for the **next-generation scripting engine** (AM 7.x / PingAM). Legacy-engine equivalents are noted where the syntax differs.

## Scripts

### Login security (`scripts/login-security/`)

| Script | Outcomes | What it does |
|---|---|---|
| `account-status-check.js` | `active` / `locked` / `error` | Routes on `inetuserstatus`; locked accounts get a lockout message |
| `account-lockout-tracker.js` | `ok` / `locked` / `error` | Blocks after N failed logins using a profile counter (header includes the increment + reset companion snippets) |
| `must-change-password.js` | `change-required` / `ok` / `error` | Detects `pwdReset=TRUE` and forces a password-change journey |
| `password-expiry-warning.js` | `expiring` / `ok` / `unknown` | Warns when the password expires within N days (puts `passwordDaysRemaining` in shared state) |
| `username-enumeration-protection.js` | `fail` | Single generic failure branch so username probing gets no signal |

### Adaptive risk (`scripts/adaptive-risk/`)

| Script | Outcomes | What it does |
|---|---|---|
| `ip-allowlist-blocklist.js` | `allowed` / `blocked` | Checks `X-Forwarded-For` / `X-Real-IP` against a blocklist, or enforces an allowlist for admin journeys |
| `login-velocity-check.js` | `normal` / `suspicious` / `error` | Flags credential-stuffing patterns: too many attempts inside a sliding window |
| `business-hours-access.js` | `allowed` / `denied` | Restricts a journey to configured days/hours (privileged journeys) |
| `device-change-stepup.js` | `known` / `changed` / `unknown` | Compares a collected device fingerprint to the stored one; first-seen and changed devices step up |

### Registration (`scripts/registration/`)

| Script | Outcomes | What it does |
|---|---|---|
| `validate-username-format.js` | `valid` / `invalid` | Enforces a username policy (length + character allowlist) before anything is written |
| `validate-email-domain.js` | `valid` / `invalid` | Restricts sign-ups to approved email domains |
| `password-strength-check.js` | `strong` / `weak` | Length, character classes, username-substring and denylist checks (never logs the password) |
| `check-existing-user.js` | `available` / `taken` / `error` | Fails fast on duplicate usernames to avoid downstream correlation conflicts |

### MFA / OTP (`scripts/mfa-otp/`)

| Script | Outcomes | What it does |
|---|---|---|
| `otp-resend-throttle.js` | `allow` / `throttled` | Circuit breaker on OTP resends (transient state, per journey run) — the fix for trees that spam SMS providers |
| `totp-enrollment-check.js` | `enrolled` / `not-enrolled` / `error` | Routes users with/without a registered TOTP device |
| `risk-based-step-up.js` | `step-up` / `standard` | Adaptive decision point: routes on a `riskScore` set earlier in the journey |

### Utilities (`scripts/utilities/`)

| Script | Outcomes | What it does |
|---|---|---|
| `auth-event-logger.js` | `done` | Emits one Splunk-ready JSON log line per decision (username, IP, outcome — never secrets) |
| `shared-state-debugger.js` | `done` | Dumps configured shared-state keys with sensitive names redacted — dev only, remove before production |
| `set-session-properties.js` | `done` | Attaches custom properties (auth method, risk score, client IP) to the SSO session |

## How to use

1. In the AM admin console, go to **Realms > [realm] > Scripts > Auth Scripts > New Script**.
2. Choose **Journey Decision Node** as the script type and paste the file contents.
3. In your journey, add a **Scripted Decision** node, select the script, and add the exact outcomes listed in the script header as the node's outcomes.
4. Wire each outcome to the next node per the placement notes in the header.

## Configuration

Every tunable lives in `var` constants at the top of each script — thresholds, attribute names, domain lists, hours. Scripts that persist data to the user profile (`frAuthFailureCount`, `frAuthAttemptHistory`, `frDeviceFingerprint`) need those attributes added to your PingDS schema first; the required names are called out in each header.

## Engine notes

- These target the **next-generation** engine: `action.goTo("outcome")`, `nodeState.get()/putShared()/putTransient()`, `nodeState.isDefined()`.
- On the **legacy** engine the equivalents are `outcome = "..."` and the `sharedState`/`transientState` bindings (deprecated in next-gen).
- `requestHeaders.get(name)` returns an array-like or `null`; header names are case-sensitive.
- `idRepository.getAttribute(username, attr)` returns a Java `Set`; the scripts handle empty/absent attributes defensively.

## Security notes

- Scripts that read the directory fail **open** on directory errors (logged) where availability matters, and the password check itself always stays authoritative. Review each fail-open choice against your own risk posture.
- Never log passwords, OTP codes, or tokens — `password-strength-check.js` and `auth-event-logger.js` are written to prove the point.
- `shared-state-debugger.js` is a development aid. Remove it before promoting a journey.

## License

MIT — see [LICENSE](LICENSE).
