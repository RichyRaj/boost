/**
 * Data structure for the data to be logged every hour
 * Needs to be JSON serializable
 */
'use strict'

const AppData = require('./appData.js');

function LogData() {
    var t = this;
    t.date = ''; // date of log
    t.hour = 0, // start hour (0 - 23)
    t.appData = new AppData(); // Active application window at the time of this log
}

module.exports = LogData;
