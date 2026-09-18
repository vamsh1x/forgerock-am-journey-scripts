/*
 * Set Session Properties
 * ---------------------------------------------------------------------------
 * ForgeRock AM / PingAM authentication tree script (Scripted Decision node).
 *
 * Node type : Scripted Decision (Journey Decision Node script)
 * Outcomes  : "done"   (single outcome on the node)
 *
 * What it does:
 *   Attaches custom properties to the SSO session created when the journey
 *   succeeds — e.g. how the user authenticated and what risk score they
 *   carried. Downstream apps and policy agents can read these from the
 *   session and make authorization decisions without calling back to AM.
 *
 * Placement : As the last Scripted Decision node before the Success node,
 *             so every property it references is already in shared state.
 *
 * Config    : PROPERTIES - static key/value pairs to always set. Dynamic
 *                          values below are pulled from shared state.
 *
 * Bindings  : nodeState, action
 * Engine    : Next-generation scripting engine (AM 7.x / PingAM)
 */

var PROPERTIES = {
    authMethod: "password+mfa",
    journeyName: "Login"
};

var outcome = action.goTo("done");

var keys = Object.keys(PROPERTIES);
for (var i = 0; i < keys.length; i++) {
    outcome = outcome.putSessionProperty(keys[i], PROPERTIES[keys[i]]);
}

// Dynamic values collected by earlier nodes in the journey.
if (nodeState.isDefined("riskScoreEvaluated")) {
    outcome = outcome.putSessionProperty("riskScore", String(nodeState.get("riskScoreEvaluated")));
}
if (nodeState.isDefined("clientIp")) {
    outcome = outcome.putSessionProperty("clientIp", String(nodeState.get("clientIp")));
}
if (nodeState.isDefined("authFailureCount")) {
    outcome = outcome.putSessionProperty("authFailureCount", String(nodeState.get("authFailureCount")));
}
