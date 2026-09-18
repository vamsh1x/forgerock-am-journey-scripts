/*
 * Auth Event Logger (Splunk-friendly)
 * ---------------------------------------------------------------------------
 * ForgeRock AM / PingAM authentication tree script (Scripted Decision node).
 *
 * Node type : Scripted Decision (Journey Decision Node script)
 * Outcomes  : "done"   (single outcome on the node)
 *
 * What it does:
 *   Emits one structured JSON log line per authentication decision, ready
 *   for Splunk ingestion. Drop this node on any branch you want to
 *   measure — login success, MFA failures, throttled resends — and set
 *   EVENT_NAME per placement. Correlate later by username, journey run,
 *   and client IP.
 *
 * Placement : Anywhere you need an audit breadcrumb. Typically just before
 *             the Success node and on key failure branches.
 *
 * Config    : EVENT_NAME - label for this placement, e.g. "login.success"
 *
 * Security  : NEVER add passwords, OTP codes, or full device fingerprints
 *             here. This line says what happened, not the secrets involved.
 *
 * Bindings  : nodeState, requestHeaders, logger, action
 * Engine    : Next-generation scripting engine (AM 7.x / PingAM)
 */

var EVENT_NAME = "login.success"; // change per placement: "login.failure", "mfa.success", ...

function header(name) {
    var values = requestHeaders.get(name);
    return values ? String(values.get(0)) : "";
}

function clientIp() {
    var fwd = header("X-Forwarded-For");
    return fwd ? fwd.split(",")[0].trim() : header("X-Real-IP");
}

var event = {
    event: EVENT_NAME,
    timestamp: new Date().toISOString(),
    username: nodeState.isDefined("username") ? String(nodeState.get("username")) : "",
    realm: nodeState.isDefined("realm") ? String(nodeState.get("realm")) : "",
    clientIp: clientIp(),
    userAgent: header("User-Agent"),
    authFailureCount: nodeState.isDefined("authFailureCount") ? Number(nodeState.get("authFailureCount")) : 0,
    riskScore: nodeState.isDefined("riskScoreEvaluated") ? Number(nodeState.get("riskScoreEvaluated")) : null
};

logger.message("AUTH_EVENT " + JSON.stringify(event));

action.goTo("done");
