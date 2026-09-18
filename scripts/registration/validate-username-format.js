/*
 * Validate Username Format
 * ---------------------------------------------------------------------------
 * ForgeRock AM / PingAM authentication tree script (Scripted Decision node).
 *
 * Node type : Scripted Decision (Journey Decision Node script)
 * Outcomes  : "valid" | "invalid"   (add both on the node)
 *
 * What it does:
 *   Enforces a username policy at the journey level, before anything is
 *   written to the directory: length bounds plus an allowlist of
 *   characters. Catches garbage early in self-registration so downstream
 *   nodes and the IDM mapping never have to deal with it.
 *
 * Placement : In a registration journey, right after the Page node that
 *             collects the username.
 *
 * Config    : USERNAME_PATTERN - the policy, as a RegExp
 *
 * Bindings  : nodeState, logger, action
 * Engine    : Next-generation scripting engine (AM 7.x / PingAM)
 */

var USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,64}$/;

var username = nodeState.isDefined("username")
    ? String(nodeState.get("username"))
    : "";

if (USERNAME_PATTERN.test(username)) {
    action.goTo("valid");
} else {
    logger.message("Username failed format validation: '" + username + "'");
    action.goTo("invalid")
        .withErrorMessage("Username must be 3-64 characters and contain only letters, numbers, dots, underscores, or hyphens.");
}
