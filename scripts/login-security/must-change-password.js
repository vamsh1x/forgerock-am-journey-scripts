/*
 * Must Change Password
 * ---------------------------------------------------------------------------
 * ForgeRock AM / PingAM authentication tree script (Scripted Decision node).
 *
 * Node type : Scripted Decision (Journey Decision Node script)
 * Outcomes  : "change-required" | "ok" | "error"   (add all three on the node)
 *
 * What it does:
 *   Detects accounts flagged for a mandatory password change. PingDS sets
 *   the operational attribute pwdReset=TRUE when an admin resets a password
 *   or when a password policy demands a change on next bind. Route those
 *   users into a forced password-change sub-journey instead of letting them
 *   in with a stale credential.
 *
 * Placement : After successful Data Store Decision, before the Success node.
 *
 * Note      : pwdReset is an operational attribute. idRepository can read it
 *             when it is explicitly requested, as done here. If your
 *             directory does not expose it, this script exits via "error".
 *
 * Bindings  : nodeState, idRepository, logger, action
 * Engine    : Next-generation scripting engine (AM 7.x / PingAM)
 */

var username = nodeState.get("username").asString();

try {
    var values = idRepository.getAttribute(username, "pwdReset");
    var mustChange = false;

    if (values && !values.isEmpty()) {
        mustChange = String(values.iterator().next()).toLowerCase() === "true";
    }

    if (mustChange) {
        logger.message("Password change required for user '" + username + "'");
        action.goTo("change-required");
    } else {
        action.goTo("ok");
    }
} catch (e) {
    logger.error("Must-change-password check failed for user '" + username + "': " + e);
    action.goTo("error");
}
