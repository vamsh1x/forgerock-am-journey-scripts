/*
 * Account Status Check
 * ---------------------------------------------------------------------------
 * ForgeRock AM / PingAM authentication tree script (Scripted Decision node).
 *
 * Node type : Scripted Decision (Journey Decision Node script)
 * Outcomes  : "active" | "locked" | "error"   (add all three on the node)
 *
 * What it does:
 *   Reads the user's inetuserstatus from the identity store and routes the
 *   journey based on it. Non-active accounts (locked, deleted, inactive)
 *   get a lockout message instead of a generic failure, which is clearer
 *   for support and safer than leaking the distinction at the login page.
 *
 * Placement : Right after the Data Store Decision node (username is already
 *             in shared state), before any credential or MFA step.
 *
 * Bindings  : nodeState, idRepository, logger, action
 * Engine    : Next-generation scripting engine (AM 7.x / PingAM)
 */

var username = nodeState.get("username").asString();

try {
    var statusValues = idRepository.getAttribute(username, "inetuserstatus");
    var status = "active"; // default when the attribute is absent

    if (statusValues && !statusValues.isEmpty()) {
        status = String(statusValues.iterator().next()).toLowerCase();
    }

    if (status === "active") {
        action.goTo("active");
    } else {
        logger.warning("Account status check: user '" + username +
            "' has non-active status '" + status + "'");
        action.goTo("locked")
            .withLockoutMessage("Your account is locked. Please contact support to restore access.");
    }
} catch (e) {
    logger.error("Account status check failed for user '" + username + "': " + e);
    action.goTo("error")
        .withErrorMessage("We could not verify your account status right now. Please try again later.");
}
