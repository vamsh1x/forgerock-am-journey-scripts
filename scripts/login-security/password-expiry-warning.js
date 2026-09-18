/*
 * Password Expiry Warning
 * ---------------------------------------------------------------------------
 * ForgeRock AM / PingAM authentication tree script (Scripted Decision node).
 *
 * Node type : Scripted Decision (Journey Decision Node script)
 * Outcomes  : "expiring" | "ok" | "unknown"   (add all three on the node)
 *
 * What it does:
 *   Reads the operational attribute pwdChangedTime from the user profile,
 *   computes how many days remain before the password hits
 *   MAX_PASSWORD_AGE_DAYS, and routes to "expiring" when the password dies
 *   within WARN_WITHIN_DAYS. Wire the "expiring" outcome to a Page node
 *   that shows a "your password expires in N days" message (the count is
 *   placed in shared state as passwordDaysRemaining).
 *
 * Placement : After successful Data Store Decision, before the Success node.
 *
 * Config    : MAX_PASSWORD_AGE_DAYS - must match your DS password policy
 *             WARN_WITHIN_DAYS      - warning window
 *
 * Note      : pwdChangedTime is operational (format: yyyyMMddHHmmssZ) and is
 *             read here with an explicit attribute request. Pure-JS date
 *             parsing is used so the script works on the next-gen engine.
 *
 * Bindings  : nodeState, idRepository, logger, action
 * Engine    : Next-generation scripting engine (AM 7.x / PingAM)
 */

var MAX_PASSWORD_AGE_DAYS = 90; // keep in sync with the DS password policy
var WARN_WITHIN_DAYS = 14;

function parseGeneralizedTime(s) {
    // "yyyyMMddHHmmssZ" -> epoch millis (UTC)
    return Date.UTC(
        parseInt(s.substr(0, 4), 10),
        parseInt(s.substr(4, 2), 10) - 1,
        parseInt(s.substr(6, 2), 10),
        parseInt(s.substr(8, 2), 10),
        parseInt(s.substr(10, 2), 10),
        parseInt(s.substr(12, 2), 10)
    );
}

var username = nodeState.get("username").asString();

try {
    var values = idRepository.getAttribute(username, "pwdChangedTime");

    if (!values || values.isEmpty()) {
        action.goTo("unknown");
    } else {
        var changedAt = parseGeneralizedTime(String(values.iterator().next()));
        var expiresAt = changedAt + MAX_PASSWORD_AGE_DAYS * 24 * 60 * 60 * 1000;
        var daysLeft = Math.floor((expiresAt - Date.now()) / (24 * 60 * 60 * 1000));

        nodeState.putShared("passwordDaysRemaining", Math.max(daysLeft, 0));

        if (daysLeft <= WARN_WITHIN_DAYS) {
            logger.message("Password for user '" + username + "' expires in " +
                Math.max(daysLeft, 0) + " day(s)");
            action.goTo("expiring");
        } else {
            action.goTo("ok");
        }
    }
} catch (e) {
    logger.error("Password expiry check failed for user '" + username + "': " + e);
    action.goTo("unknown");
}
