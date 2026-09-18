/*
 * Username Enumeration Protection
 * ---------------------------------------------------------------------------
 * ForgeRock AM / PingAM authentication tree script (Scripted Decision node).
 *
 * Node type : Scripted Decision (Journey Decision Node script)
 * Outcomes  : "fail"   (single outcome on the node)
 *
 * What it does:
 *   Nothing clever on purpose. Place it on the Data Store Decision "false"
 *   branch so unknown usernames and wrong passwords travel the exact same
 *   path, take the same time, and surface the same generic message. Attackers
 *   probing for valid usernames get no signal to distinguish the two cases.
 *
 * Placement : Data Store Decision "false" outcome -> this node -> Failure node.
 *
 * Why a script instead of wiring straight to Failure:
 *   It gives you one place to attach a uniform error message, emit a
 *   failed-login audit event, and keep timing consistent if you later add
 *   decoy work on this branch.
 *
 * Bindings  : logger, action
 * Engine    : Next-generation scripting engine (AM 7.x / PingAM)
 */

// Deliberately generic: identical for bad username and bad password.
logger.message("Authentication failed (enumeration-safe branch)");

action.goTo("fail")
    .withErrorMessage("Invalid username or password.");
