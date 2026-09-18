/*
 * Account Lockout Tracker (check side)
 * ---------------------------------------------------------------------------
 * ForgeRock AM / PingAM authentication tree script (Scripted Decision node).
 *
 * Node type : Scripted Decision (Journey Decision Node script)
 * Outcomes  : "ok" | "locked" | "error"   (add all three on the node)
 *
 * What it does:
 *   Reads a failed-login counter stored on the user profile and blocks the
 *   journey once the counter reaches MAX_FAILURES. This is the CHECK half of
 *   the pattern; pair it with the increment snippet below on the failure
 *   branch, and reset the counter to 0 on the success branch.
 *
 * Placement : Immediately after the Data Store Decision node, before MFA.
 *
 * Config    : MAX_FAILURES - failed attempts before lockout
 *             COUNTER_ATTR - profile attribute holding the counter.
 *                            Must exist in the DS schema (integer syntax).
 *
 * Companion increment script (Scripted Decision node on the Data Store
 * Decision "false" outcome, single outcome "done"):
 *
 *   var username = nodeState.get("username").asString();
 *   var current = idRepository.getAttribute(username, "frAuthFailureCount");
 *   var count = (current && !current.isEmpty()) ? parseInt(current.iterator().next(), 10) : 0;
 *   idRepository.setAttribute(username, "frAuthFailureCount", String(count + 1));
 *   nodeState.putShared("authFailureCount", count + 1);
 *   action.goTo("done");
 *
 * And on the success branch, reset it:
 *
 *   idRepository.setAttribute(username, "frAuthFailureCount", "0");
 *
 * Bindings  : nodeState, idRepository, logger, action
 * Engine    : Next-generation scripting engine (AM 7.x / PingAM)
 */

var MAX_FAILURES = 5;
var COUNTER_ATTR = "frAuthFailureCount"; // extend your DS schema with this attribute

var username = nodeState.get("username").asString();

try {
    var values = idRepository.getAttribute(username, COUNTER_ATTR);
    var failures = 0;

    if (values && !values.isEmpty()) {
        failures = parseInt(values.iterator().next(), 10) || 0;
    }

    nodeState.putShared("authFailureCount", failures);

    if (failures >= MAX_FAILURES) {
        logger.warning("Account lockout: user '" + username +
            "' blocked after " + failures + " failed attempts");
        action.goTo("locked")
            .withLockoutMessage("Your account is temporarily locked after too many failed attempts. Please try again later or contact support.");
    } else {
        action.goTo("ok");
    }
} catch (e) {
    logger.error("Lockout check failed for user '" + username + "': " + e);
    // Fail open so a directory hiccup does not lock everyone out;
    // the Data Store Decision node still enforces the password.
    action.goTo("error");
}
