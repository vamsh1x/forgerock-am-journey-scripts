/*
 * Validate Email Domain
 * ---------------------------------------------------------------------------
 * ForgeRock AM / PingAM authentication tree script (Scripted Decision node).
 *
 * Node type : Scripted Decision (Journey Decision Node script)
 * Outcomes  : "valid" | "invalid"   (add both on the node)
 *
 * What it does:
 *   Restricts self-registration to approved email domains — the standard
 *   move for workforce or partner journeys where random Gmail signups must
 *   not create accounts. Comparison is case-insensitive and matches the
 *   domain part after the last "@".
 *
 * Placement : In a registration journey, after the Page node collecting the
 *             email address (shared-state key "mail" by convention).
 *
 * Config    : ALLOWED_DOMAINS - lowercase domains; empty list means "any
 *                               syntactically valid email"
 *             EMAIL_STATE_KEY - shared-state key holding the email
 *
 * Bindings  : nodeState, logger, action
 * Engine    : Next-generation scripting engine (AM 7.x / PingAM)
 */

var ALLOWED_DOMAINS = ["example.com", "partner.example.org"];
var EMAIL_STATE_KEY = "mail";

function isValidEmailFormat(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

var email = nodeState.isDefined(EMAIL_STATE_KEY)
    ? String(nodeState.get(EMAIL_STATE_KEY)).trim()
    : "";

if (!isValidEmailFormat(email)) {
    action.goTo("invalid")
        .withErrorMessage("Please enter a valid email address.");
} else if (ALLOWED_DOMAINS.length === 0) {
    action.goTo("valid");
} else {
    var domain = email.substring(email.lastIndexOf("@") + 1).toLowerCase();
    if (ALLOWED_DOMAINS.indexOf(domain) !== -1) {
        action.goTo("valid");
    } else {
        logger.message("Registration rejected for non-allowed email domain: " + domain);
        action.goTo("invalid")
            .withErrorMessage("Registration is limited to approved organization email domains.");
    }
}
