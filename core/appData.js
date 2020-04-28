/**
 * Data structure to represent an Active Application
 */

'use strict'

function AppData() {
    var t = this;
    t.name = ''; // App Name
    t.duration = 0; // Duration for which it was active
    t.title = ""; // Tab title
}

module.exports = AppData;
