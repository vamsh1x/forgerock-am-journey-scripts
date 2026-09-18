/*
 * Login Velocity Check
 * ---------------------------------------------------------------------------
 * ForgeRock AM / PingAM authentication tree script (Scripted Decision node).
 *
 * Node type : Scripted Decision (Journey Decision Node script)
 * Outcomes  : "normal" | "suspicious" | "error"   (add all three on the node)
 *
 * What it does:
 *   Keeps a rolling history of recent authentication attempts on the user
 *   profile (JSON array of epoch millis) and flags the journey when more
 *   than MAX_ATTEMPTS land inside WINDOW_MINUTES. Classic credential-
 *   stuffing tripwire: wire "suspicious" into step-up auth or a hard block.
 *   The current attempt count is left in shared state as loginAttemptCount.
 *
 * Placement : After the username is known (post Page node), before password
 *             verification — you want the signal even when the password is
 *             wrong.
 *
 * Config    : WINDOW_MINUTES - sliding window
 *             MAX_ATTEMPTS   - attempts inside the window that trigger "suspicious"
 *             HISTORY_ATTR   - profile attribute holding the JSON history.
 *                              Must exist in the DS schema (string syntax).
 *
 * Bindings  : nodeState, idRepository, logger, action
 * Engine    : Next-generation scripting engine (AM 7.x / PingAM)
 */

var WINDOW_MINUTES = 10;
var MAX_ATTEMPTS = 5;
var HISTORY_ATTR = "frAuthAttemptHistory"; // JSON array of epoch millis; extend your DS schema

var username = nodeState.get("username").asString();

try {
    var values = idRepository.getAttribute(username, HISTORY_ATTR);
    var history = [];
    if (values && !values.isEmpty()) {
        history = JSON.parse(values.iterator().next());
    }

    var cutoff = Date.now() - WINDOW_MINUTES * 60 * 1000;
    var recent = [];
    for (var i = 0; i < history.length; i++) {
        if (history[i] >= cutoff) {
            recent.push(history[i]);
        }
    }
    recent.push(Date.now());

    idRepository.setAttribute(username, HISTORY_ATTR, JSON.stringify(recent));
    nodeState.putShared("loginAttemptCount", recent.length);

    if (recent.length > MAX_ATTEMPTS) {
        logger.warning("Suspicious login velocity for user '" + username +
            "': " + recent.length + " attempts in " + WINDOW_MINUTES + " minutes");
        action.goTo("suspicious");
    } else {
        action.goTo("normal");
    }
} catch (e) {
    logger.error("Login velocity check failed for user '" + username + "': " + e);
    // Fail open: a broken counter must not take down logins.
    action.goTo("error");
}
