/*
 * IP Allowlist / Blocklist
 * ---------------------------------------------------------------------------
 * ForgeRock AM / PingAM authentication tree script (Scripted Decision node).
 *
 * Node type : Scripted Decision (Journey Decision Node script)
 * Outcomes  : "allowed" | "blocked"   (add both on the node)
 *
 * What it does:
 *   Takes the client IP from X-Forwarded-For (first entry) or X-Real-IP and
 *   checks it against a blocklist, or — when MODE is "allowlist" — requires
 *   it to appear on an allowlist (handy for admin-only journeys).
 *   Entries may be exact IPs ("203.0.113.10") or prefixes ending with a dot
 *   ("10.0.0." matches the whole /24).
 *
 * Placement : Very first node in the journey, before the username Page node,
 *             so hostile IPs never even see the login form.
 *
 * Config    : MODE      - "blocklist" or "allowlist"
 *             BLOCKED   - IPs/prefixes to deny
 *             ALLOWED   - IPs/prefixes to permit (allowlist mode only)
 *
 * Note      : Trust X-Forwarded-For only when AM sits behind a proxy/load
 *             balancer you control; otherwise clients can spoof it.
 *
 * Bindings  : requestHeaders, nodeState, logger, action
 * Engine    : Next-generation scripting engine (AM 7.x / PingAM)
 */

var MODE = "blocklist"; // or "allowlist"

var BLOCKED = [
    "203.0.113.10",
    "198.51.100." // whole /24 prefix
];

var ALLOWED = [
    "10.0.0.",   // corporate range
    "192.0.2.25"
];

function clientIp() {
    var fwd = requestHeaders.get("X-Forwarded-For");
    if (fwd) {
        return String(fwd.get(0)).split(",")[0].trim();
    }
    var real = requestHeaders.get("X-Real-IP");
    if (real) {
        return String(real.get(0)).trim();
    }
    return "unknown";
}

function matches(ip, list) {
    for (var i = 0; i < list.length; i++) {
        var entry = list[i];
        if (entry.charAt(entry.length - 1) === "." ? ip.indexOf(entry) === 0 : ip === entry) {
            return true;
        }
    }
    return false;
}

var ip = clientIp();
nodeState.putShared("clientIp", ip);

var blocked = (MODE === "allowlist") ? !matches(ip, ALLOWED) : matches(ip, BLOCKED);

if (blocked) {
    logger.warning("Blocked login attempt from IP " + ip + " (mode: " + MODE + ")");
    action.goTo("blocked")
        .withErrorMessage("Access denied from this network.");
} else {
    action.goTo("allowed");
}
