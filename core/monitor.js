/**
 * The master backend of the application
 * Will collect data and log at intervals
 */
'use strict';

const path = require('path');
const moment = require('moment');
const DataStore = require('nedb');
const activeWin = require('active-win');
const LogData = require('./logData.js');
const configManager = require('./configManager.js');

console.log("CF")
console.log(configManager)

const DB_NAME = 'store.db';

var config = {},
    delaySeconds = 3 * 2,
    logEverySeconds = 30,
    appMeta = {},
    db = '', // Database    
    cTick = 0, // Start at 0 and tick delaySeconds incrementally
    watchTimer = 0,    
    doNotCollect = false, // flag for collecting data. Will be set to true when saving
    logCollection = [], // List of log data. Batch write every logEverySeconds
    
    processString = function(str, isName = false) {
        // takes in a string, trims it, removes spaces, converts to lowercase and removes non-alphanumeric characters
        // If is Name is true, will remove the file extension
        if (isName) {
            str = str.split('.')[0];
        }
        str = str.trim();
        str = str.replace(/\s+/g, '');
        str = str.toLowerCase();
        return str.replace(/[^A-Za-z0-9]/g, '');        
    },

    classifyTitle = function(title) {
        // Note: This is a very very inefficient solution
        // TODO: Think of a better way to handle this    

        for (var i = 0; i < appMeta.distraction.length; i++) {
            var n = processString(appMeta.distraction[i]);
            if (title.includes(n)) {
                return 'np';
            }
        }

        for (var i = 0; i < appMeta.productive.length; i++) {
            var n = processString(appMeta.productive[i]);
            if (title.includes(n)) {
                return 'p';
            }
        }

        return 'na';
    },

    classify = function(name, title) {
        // Note: This is an inefficient solution
        // TODO: Think of a better way to handle this

        var pClass = 'na'; // start with neutral
        var aName = processString(name, true);
        var aTitle = processString(title);        

        if (aName === 'chrome') {        
            // Use title to classify
            return classifyTitle(aTitle);
        }    
        if (appMeta.distraction.includes(aName)) {
            pClass = 'np';
        } else if (appMeta.productive.includes(aName)) {
            pClass = 'p';
        } else {            
            console.log("Retyurbn " + "ps" + classifyTitle(aTitle));
            return classifyTitle(aTitle);
        }        
        return pClass;
    },
    logDataReducer = function(logs) {
        // Takes in a log of LogData records and reduces them grouping by title and adding duration
        var l = logs.length;
        var reduced = {};
        for (var i = 0; i < l; i++) {
            var log = logs[i];
            console.log(log);
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
                reduced[appD.title].appData.type = appD.type;
            }
            console.log("Reduced")
            console.log(reduced);
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
            appData.type = classify(aName, aTitle);
            logCollection.push(lData);
        })();
    },
    resetState = function() {
        console.log("Reset Data");
        logCollection = [];
    },
    saveData = function(onSuccess) {
        // Persistence
        // Configurable by config.logAfterSeconds
        console.log("Logging Data");                
        db.insert(logDataReducer(logCollection), function(_err) {
            var err = !(typeof _err === 'undefined');
            // TODO: Handle Error Separately
            console.log("Write Success !");
            onSuccess();
        });
    },
    saveAndResetData = function(_kill) {
        var kill = (typeof _kill === 'boolean') ? _kill : false;
        var onSuccessFullSave = function () {
            resetState();
            doNotCollect = false;
            if (kill) {
                clearInterval(watchTimer);
                watchTimer = 0;
                console.log("All Clear");
                process.send({
                    type: 'stop-complete',
                    data: {}
                });
            }
        };
        doNotCollect = true;
        saveData(onSuccessFullSave);        
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
            saveAndResetData();
        }
    },
    parseConfig = function(data) {
        config = data || {};
        var filePath = path.join((config.userDataPath || '')  + ('/' + DB_NAME));
        db = new DataStore({
            filename: filePath,
            autoload: true
        });
        var userConfig = configManager.getConfig(config.userDataPath);
        delaySeconds = userConfig.collectDataEverySeconds;
        logEverySeconds = userConfig.saveDataEverySeconds;
        appMeta = userConfig.apps;
        console.log("Collecting every " + delaySeconds);
        console.log("Logging every " + logEverySeconds);                
    },
    setup = function(data) {
        parseConfig(data);
        watchTimer = setInterval(watch, delaySeconds * 1000);
    },
    stop = function() {
        saveAndResetData(true);
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
