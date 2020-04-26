/**
 * The master backend of the application
 * Will collect data and log at intervals
 */
'use strict';

const moment = require('moment')
const LogData = require('./logData.js')

var config = {}, // TODO: 
    delaySeconds = 3 * 2,
    logEverySeconds = 12,
    cTick = 0, // Start at 0 and tick delaySeconds incrementally
    watchTimer = 0,
    doNotCollect = false, // flag for collecting data. Will be set to true when saving
    collectData = function() {
        // Collects data every delaySeconds
        // Is not persisted until end of config.logAfterSeconds
        if (doNotCollect) return;
        console.log("Collecting Data");
    },
    resetData = function() {
        console.log("Reset Data");
    },
    saveData = function() {
        // Writes to electron-store which will automatically persist
        // Configurable by config.logAfterSeconds
        console.log("Logging Data");
    },
    watch = function() {
        // Called every two minutes
        var ct = parseInt(moment().format("m"));
        cTick += delaySeconds;
        console.log("CT " + ct);
        console.log("C Tick " + cTick);
        collectData();
        if (cTick >= logEverySeconds) {
            cTick = 0;
            doNotCollect = true;
            saveData();
            resetData();
            doNotCollect = false;
        }
    },
    setup = function() {            
        watchTimer = setInterval(watch, delaySeconds * 1000);
    },
    stop = function() {
        clearInterval(watchTimer);
        watchTimer = 0;
        console.log("All Clear");                        
    };



// IPC (main - monitor)
process.on('message', (m) => {
    console.log("From Main: " + m);
    var type = m.type || '',
        data = m.data || {};
    switch(type) {
        case 'start':
            setup();
            break;
        case 'stop':
            stop();
            break;
        default:
            console.log(type + " not supported !");
            break;

    }
});
