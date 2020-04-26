/**
 * Data structure for the data to be logged every hour
 * Needs to be JSON serializable
 */
'use strict'

function LogData() {
    var t = this;
    t.date = ''; // date of log
    t.hour = 0, // start hour (0 - 23)
    t.apps = []; // list of apps that were running in this hour (App represented by AppData)    
}

module.exports = LogData;
