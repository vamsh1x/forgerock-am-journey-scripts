/*
 * Password Strength Check
 * ---------------------------------------------------------------------------
 * ForgeRock AM / PingAM authentication tree script (Scripted Decision node).
 *
 * Node type : Scripted Decision (Journey Decision Node script)
 * Outcomes  : "strong" | "weak"   (add both on the node)
 *
 * What it does:
 *   Journey-level password policy for registration or password-change
 *   flows: minimum length, four character classes, must not contain the
 *   username, and must not be on a small denylist of famously bad
 *   passwords. Runs before the password is persisted, so users get
 *   immediate, specific feedback.
 *
 * Placement : After the Page node that collects the new password. The
 *             password is expected in TRANSIENT state (never shared state),
 *             key configurable below.
 *
 * Config    : PASSWORD_STATE_KEY - transient-state key for the password
 *             MIN_LENGTH         - minimum length
 *
 * Security  : The password is NEVER logged. Only the failed rule names are
 *             recorded, and the username is only checked as a substring.
 *
 * Bindings  : nodeState, logger, action
 * Engine    : Next-generation scripting engine (AM 7.x / PingAM)
 */

var PASSWORD_STATE_KEY = "password"; // transient state
var MIN_LENGTH = 12;

var DENIED_PASSWORDS = [
    "password", "password123", "changeme", "welcome123",
    "qwerty123", "letmein123", "admin123"
];

var password = nodeState.isDefined(PASSWORD_STATE_KEY)
    ? String(nodeState.get(PASSWORD_STATE_KEY))
    : "";
var username = nodeState.isDefined("username")
    ? String(nodeState.get("username")).toLowerCase()
    : "";

var failedRules = [];

if (password.length < MIN_LENGTH) {
    failedRules.push("at least " + MIN_LENGTH + " characters");
}
if (!/[a-z]/.test(password)) {
    failedRules.push("a lowercase letter");
}
if (!/[A-Z]/.test(password)) {
    failedRules.push("an uppercase letter");
}
if (!/[0-9]/.test(password)) {
    failedRules.push("a digit");
}
if (!/[^a-zA-Z0-9]/.test(password)) {
    failedRules.push("a special character");
}
if (username && password.toLowerCase().indexOf(username) !== -1) {
    failedRules.push("must not contain your username");
}
if (DENIED_PASSWORDS.indexOf(password.toLowerCase()) !== -1) {
    failedRules.push("too common — pick something less guessable");
}

if (failedRules.length === 0) {
    action.goTo("strong");
} else {
    logger.message("Password strength check failed (" + failedRules.length + " rule(s))");
    action.goTo("weak")
        .withErrorMessage("Password must include " + failedRules.join(", ") + ".");
}
