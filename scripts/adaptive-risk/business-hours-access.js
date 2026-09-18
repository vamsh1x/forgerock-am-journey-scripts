/*
 * Business Hours Access
 * ---------------------------------------------------------------------------
 * ForgeRock AM / PingAM authentication tree script (Scripted Decision node).
 *
 * Node type : Scripted Decision (Journey Decision Node script)
 * Outcomes  : "allowed" | "denied"   (add both on the node)
 *
 * What it does:
 *   Restricts a journey (typically an admin or privileged journey) to
 *   configured days and hours. Outside the window the journey ends with a
 *   clear message instead of failing mysteriously at some later node.
 *
 * Placement : First node of the restricted journey.
 *
 * Config    : ALLOWED_DAYS - 0=Sunday .. 6=Saturday (JS Date convention)
 *             START_HOUR / END_HOUR - 24h clock, END_HOUR exclusive
 *
 * Note      : Uses the AM server's local time. If AM runs in UTC and your
 *             users are elsewhere, shift the hours to compensate or run this
 *             behind a node that resolves the user's timezone first.
 *
 * Bindings  : logger, action
 * Engine    : Next-generation scripting engine (AM 7.x / PingAM)
 */

var ALLOWED_DAYS = [1, 2, 3, 4, 5]; // Monday-Friday
var START_HOUR = 8;  // 08:00 inclusive
var END_HOUR = 18;   // 18:00 exclusive

var now = new Date();
var day = now.getDay();
var hour = now.getHours();

var dayOk = ALLOWED_DAYS.indexOf(day) !== -1;
var hourOk = hour >= START_HOUR && hour < END_HOUR;

if (dayOk && hourOk) {
    action.goTo("allowed");
} else {
    logger.message("Access outside business hours denied (day=" + day + " hour=" + hour + ")");
    action.goTo("denied")
        .withErrorMessage("This service is available Monday to Friday, 8:00 AM to 6:00 PM.");
}
