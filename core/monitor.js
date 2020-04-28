/**
 * The master backend of the application
 * Will collect data and log at intervals
 */
'use strict';

const path = require('path');
const moment = require('moment');
const DataStore = require('nedb');
const LogData = require('./logData.js');
const activeWin = require('active-win');

const dbName = 'store.db';

var config = {},
    delaySeconds = 3 * 2,
    logEverySeconds = 30,
    db = '', // Database    
    cTick = 0, // Start at 0 and tick delaySeconds incrementally
    watchTimer = 0,    
    doNotCollect = false, // flag for collecting data. Will be set to true when saving
    logCollection = [], // List of log data. Batch write every logEverySeconds
    
    logDataReducer = function(logs) {
        // Takes in a log of LogData records and reduces them grouping by title and adding duration
        var l = logs.length;
        var reduced = {};
        for (var i = 0; i < l; i++) {
            var log = logs[i];
            var appD = log.appData;
            if (reduced[appD.title]) {
                reduced[appD.title].appData.duration += appD.duration;
            } else {
                reduced[appD.title] = new LogData();
                reduced[appD.title].date = log.date;
                reduced[appD.title].hour = log.hour;
                reduced[appD.title].appData.name = appD.name;
                reduced[appD.title].appData.title = appD.title;
                reduced[appD.title].appData.duration = appD.duration;
            }
        }
        return Object.values(reduced);
    },
    collectData = function() {
        // Collects data every delaySeconds
        // Is not persisted until end of config.logAfterSeconds
        if (doNotCollect) return;
        console.log("Collecting Data");
        var lData = new LogData();
        lData.date = moment().format("MMM Do YYYY");
        lData.hour = parseInt(moment().format("H")); // 0 - 23        
        (async () => {
            var aWin = await activeWin(),
                aName = (aWin && aWin.owner && aWin.owner.name) ? aWin.owner.name : (aWin && aWin.title) ? aWin.title : '',
                aTitle = (aWin && aWin.title) ? aWin.title : '',
                appData = lData.appData;
            appData.name = aName;
            appData.duration = delaySeconds;
            appData.title = aTitle;
            logCollection.push(lData);
        })();
    },
    resetState = function() {
        console.log("Reset Data");
        logCollection = [];
    },
    saveData = function() {
        // Persistence
        // Configurable by config.logAfterSeconds
        console.log("Logging Data");        
        db.insert(logDataReducer(logCollection));
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
            resetState();
            doNotCollect = false;
        }
    },
    parseConfig = function(data) {
        config = data || {};
        console.log(config);
        var filePath = path.join((config.userDataPath || '')  + ('/' + dbName));
        console.log(filePath);
        db = new DataStore({
            filename: filePath,
            autoload: true
        });
    },
    setup = function(data) {
        parseConfig(data);
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
            setup(data);
            break;
        case 'stop':
            stop();
            break;
        default:
            console.log(type + " not supported !");
            break;

    }
});
