/**
 * Data structure to represent an Active Application
 */

'use strict'

function AppData() {
    var t = this;
    t.name = ''; // App Name
    t.duration = 0; // Duration for which it was active
    t.title = ""; // Tab title
    t.type = 'na'; // Can be one of na, p (productive) or np (not productive)
}

module.exports = AppData;
