/*
 * OTP Resend Throttle
 * ---------------------------------------------------------------------------
 * ForgeRock AM / PingAM authentication tree script (Scripted Decision node).
 *
 * Node type : Scripted Decision (Journey Decision Node script)
 * Outcomes  : "allow" | "throttled"   (add both on the node)
 *
 * What it does:
 *   Caps how many times a user can request a fresh OTP inside one journey
 *   run. Resend loops are the classic way an AM tree bug turns into a
 *   five-figure Twilio bill — this script is the circuit breaker. The
 *   counter lives in TRANSIENT state, so it resets naturally on a fresh
 *   journey and never persists PII anywhere.
 *
 * Placement : On the "Resend code" branch of your OTP journey, just before
 *             the node that actually sends the OTP.
 *
 * Config    : MAX_RESENDS    - resends allowed per window
 *             WINDOW_MINUTES - sliding window length
 *
 * Bindings  : nodeState, logger, action
 * Engine    : Next-generation scripting engine (AM 7.x / PingAM)
 */

var MAX_RESENDS = 3;
var WINDOW_MINUTES = 10;

var COUNT_KEY = "otpResendCount";
var WINDOW_START_KEY = "otpResendWindowStart";

var now = Date.now();
var count = nodeState.isDefined(COUNT_KEY) ? Number(nodeState.get(COUNT_KEY)) : 0;
var windowStart = nodeState.isDefined(WINDOW_START_KEY) ? Number(nodeState.get(WINDOW_START_KEY)) : now;

// Roll the window forward when it has expired.
if (now - windowStart > WINDOW_MINUTES * 60 * 1000) {
    count = 0;
    windowStart = now;
}

if (count >= MAX_RESENDS) {
    logger.warning("OTP resend throttled: " + count + " resends within " +
        WINDOW_MINUTES + " minutes (transient state)");
    action.goTo("throttled")
        .withErrorMessage("Too many codes requested. Please wait a few minutes and try again.");
} else {
    nodeState.putTransient(COUNT_KEY, count + 1);
    nodeState.putTransient(WINDOW_START_KEY, windowStart);
    nodeState.putShared("otpResendCount", count + 1); // visible for monitoring
    action.goTo("allow");
}
