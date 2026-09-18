/*
 * Check Existing User
 * ---------------------------------------------------------------------------
 * ForgeRock AM / PingAM authentication tree script (Scripted Decision node).
 *
 * Node type : Scripted Decision (Journey Decision Node script)
 * Outcomes  : "available" | "taken" | "error"   (add all three on the node)
 *
 * What it does:
 *   Prevents duplicate registrations by checking whether the requested
 *   username already exists in the identity store before the journey
 *   creates the account. Failing fast here avoids ugly IDM correlation
 *   conflicts (FOUND_ALREADY_LINKED and friends) later.
 *
 * Placement : In a registration journey, after username collection and
 *             format validation.
 *
 * Note      : This checks username existence. If you also need an email
 *             uniqueness check, do it with a dedicated query against the
 *             directory (or IDM) — idRepository has no search-by-attribute
 *             API from a journey script.
 *
 * Bindings  : nodeState, idRepository, logger, action
 * Engine    : Next-generation scripting engine (AM 7.x / PingAM)
 */

var username = nodeState.isDefined("username")
    ? String(nodeState.get("username")).trim()
    : "";

if (!username) {
    action.goTo("error")
        .withErrorMessage("Username is required.");
} else {
    try {
        var values = idRepository.getAttribute(username, "uid");
        var exists = values && !values.isEmpty();

        if (exists) {
            logger.message("Registration attempt for existing username '" + username + "'");
            // Same wording as a generic failure: do not confirm which
            // usernames exist to anonymous callers.
            action.goTo("taken")
                .withErrorMessage("This username is not available. Please choose another.");
        } else {
            action.goTo("available");
        }
    } catch (e) {
        logger.error("Existing-user check failed for '" + username + "': " + e);
        action.goTo("error")
            .withErrorMessage("We could not verify username availability right now. Please try again.");
    }
}
