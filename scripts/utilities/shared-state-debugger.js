/*
 * Shared State Debugger
 * ---------------------------------------------------------------------------
 * ForgeRock AM / PingAM authentication tree script (Scripted Decision node).
 *
 * Node type : Scripted Decision (Journey Decision Node script)
 * Outcomes  : "done"   (single outcome on the node)
 *
 * What it does:
 *   Logs the values of a configured list of shared-state keys so you can
 *   see exactly what the journey is carrying at this point. Keys whose
 *   names look sensitive are redacted automatically. This is a DEVELOPMENT
 *   aid — remove the node (or empty DEBUG_KEYS) before promoting the
 *   journey to production.
 *
 * Placement : Anywhere in a journey while you are building or debugging it.
 *
 * Config    : DEBUG_KEYS - shared-state keys to dump. Empty = dump nothing.
 *
 * Security  : Any key matching /password|secret|token|otp|code/i is logged
 *             as "[REDACTED]". Still, keep this out of production journeys.
 *
 * Bindings  : nodeState, logger, action
 * Engine    : Next-generation scripting engine (AM 7.x / PingAM)
 */

var DEBUG_KEYS = [
    "username",
    "realm",
    "clientIp",
    "authFailureCount",
    "riskScore",
    "deviceFingerprint"
];

var SENSITIVE = /password|secret|token|otp|code|pin/i;

for (var i = 0; i < DEBUG_KEYS.length; i++) {
    var key = DEBUG_KEYS[i];
    if (!nodeState.isDefined(key)) {
        logger.message("[journey-debug] " + key + " = <undefined>");
    } else if (SENSITIVE.test(key)) {
        logger.message("[journey-debug] " + key + " = [REDACTED]");
    } else {
        logger.message("[journey-debug] " + key + " = " + nodeState.get(key));
    }
}

action.goTo("done");
