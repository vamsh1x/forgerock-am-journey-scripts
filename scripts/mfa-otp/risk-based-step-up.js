/*
 * Risk-Based Step-Up Router
 * ---------------------------------------------------------------------------
 * ForgeRock AM / PingAM authentication tree script (Scripted Decision node).
 *
 * Node type : Scripted Decision (Journey Decision Node script)
 * Outcomes  : "step-up" | "standard"   (add both on the node)
 *
 * What it does:
 *   The decision point of an adaptive journey. Reads a numeric riskScore
 *   (0-100) from shared state — set earlier by your own scoring logic or by
 *   combining signals from scripts like login-velocity-check.js and
 *   device-change-stepup.js — and routes high-risk logins into step-up
 *   authentication (OTP / WebAuthn / push) while low-risk logins continue
 *   with the standard path.
 *
 * Placement : After all risk signals are collected, before the Success node.
 *             Wire "step-up" to your MFA sub-journey and "standard" onward.
 *
 * Config    : RISK_THRESHOLD - score at/above which step-up is required
 *             SCORE_KEY      - shared-state key holding the score
 *
 * Bindings  : nodeState, logger, action
 * Engine    : Next-generation scripting engine (AM 7.x / PingAM)
 */

var RISK_THRESHOLD = 70;
var SCORE_KEY = "riskScore";

var score = 0;
if (nodeState.isDefined(SCORE_KEY)) {
    score = Number(nodeState.get(SCORE_KEY)) || 0;
}

nodeState.putShared("riskScoreEvaluated", score);

if (score >= RISK_THRESHOLD) {
    logger.warning("Step-up required: risk score " + score +
        " >= threshold " + RISK_THRESHOLD);
    action.goTo("step-up");
} else {
    action.goTo("standard");
}
