/*
 * Device Change Step-Up
 * ---------------------------------------------------------------------------
 * ForgeRock AM / PingAM authentication tree script (Scripted Decision node).
 *
 * Node type : Scripted Decision (Journey Decision Node script)
 * Outcomes  : "known" | "changed" | "unknown"   (add all three on the node)
 *
 * What it does:
 *   Compares a device fingerprint collected earlier in the journey (for
 *   example by a client-side script pushing into a HiddenValueCallback, or
 *   by the Device Profile Collector node) against the fingerprint stored on
 *   the user profile. A changed device routes to step-up authentication;
 *   a first-seen device is stored and treated as "changed" once, so the
 *   user proves themselves before the new device is trusted.
 *
 * Placement : After username is known and the fingerprint is in shared
 *             state, before the Success node.
 *
 * Config    : FINGERPRINT_STATE_KEY - shared-state key holding the freshly
 *                                     collected fingerprint
 *             STORED_ATTR           - profile attribute holding the last
 *                                     trusted fingerprint (extend DS schema)
 *
 * Bindings  : nodeState, idRepository, logger, action
 * Engine    : Next-generation scripting engine (AM 7.x / PingAM)
 */

var FINGERPRINT_STATE_KEY = "deviceFingerprint";
var STORED_ATTR = "frDeviceFingerprint"; // extend your DS schema with this attribute

var username = nodeState.get("username").asString();

try {
    if (!nodeState.isDefined(FINGERPRINT_STATE_KEY)) {
        logger.warning("No device fingerprint in shared state for user '" + username + "'");
        action.goTo("unknown");
    } else {
        var current = String(nodeState.get(FINGERPRINT_STATE_KEY));
        var storedValues = idRepository.getAttribute(username, STORED_ATTR);
        var stored = (storedValues && !storedValues.isEmpty())
            ? String(storedValues.iterator().next())
            : null;

        if (stored === null) {
            // First login with fingerprinting: remember it, but step up once.
            idRepository.setAttribute(username, STORED_ATTR, current);
            logger.message("First-seen device registered for user '" + username + "'");
            action.goTo("changed");
        } else if (stored === current) {
            action.goTo("known");
        } else {
            logger.warning("Device change detected for user '" + username + "'");
            nodeState.putShared("previousDeviceFingerprint", stored);
            idRepository.setAttribute(username, STORED_ATTR, current);
            action.goTo("changed");
        }
    }
} catch (e) {
    logger.error("Device check failed for user '" + username + "': " + e);
    action.goTo("unknown");
}
