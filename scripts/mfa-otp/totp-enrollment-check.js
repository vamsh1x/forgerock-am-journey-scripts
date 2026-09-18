/*
 * TOTP Enrollment Check
 * ---------------------------------------------------------------------------
 * ForgeRock AM / PingAM authentication tree script (Scripted Decision node).
 *
 * Node type : Scripted Decision (Journey Decision Node script)
 * Outcomes  : "enrolled" | "not-enrolled" | "error"   (add all three)
 *
 * What it does:
 *   Checks whether the user already has a TOTP/OATH device registered by
 *   looking for the device profile attribute on their identity-store
 *   entry. Route "not-enrolled" into your enrollment journey (QR code /
 *   ForgeRock Authenticator pairing) and "enrolled" straight to the OTP
 *   verification node.
 *
 * Placement : After the user is identified, before the OATH registration
 *             or verification nodes.
 *
 * Config    : DEVICE_ATTR - profile attribute holding OATH device profiles.
 *                           Confirm the exact name in your AM version; it is
 *                           "oathDeviceProfiles" on standard deployments.
 *
 * Bindings  : nodeState, idRepository, logger, action
 * Engine    : Next-generation scripting engine (AM 7.x / PingAM)
 */

var DEVICE_ATTR = "oathDeviceProfiles"; // verify against your AM version

var username = nodeState.get("username").asString();

try {
    var values = idRepository.getAttribute(username, DEVICE_ATTR);
    var enrolled = values && !values.isEmpty();

    // A stored value of "[]" / "{}" counts as not enrolled.
    if (enrolled) {
        var raw = String(values.iterator().next()).trim();
        enrolled = raw !== "" && raw !== "[]" && raw !== "{}";
    }

    nodeState.putShared("totpEnrolled", enrolled);
    action.goTo(enrolled ? "enrolled" : "not-enrolled");
} catch (e) {
    logger.error("TOTP enrollment check failed for user '" + username + "': " + e);
    action.goTo("error")
        .withErrorMessage("We could not check your authenticator enrollment right now.");
}
