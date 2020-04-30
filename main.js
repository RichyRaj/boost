// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path');

const { fork } = require('child_process');

const moment = require('moment');
const DataStore = require('nedb');
const configManager = require('./core/configManager.js');

const STATE_IDLE = 'idle',
  STATE_TRACKING = 'tracking',
  WILL_EXIT = 'will_exit';

var monitorP = '', // child process
  appState = STATE_IDLE;

const DB_NAME = 'store.db';

var mainWindow = "";

// =============== Data Collection Methods ===============
function getTodayAppUsage() {
  var filePath = path.join(app.getPath('userData')  + ('/' + DB_NAME)),
    db = new DataStore({
      filename: filePath,
      autoload: true
    });
  
    db.find({ date: moment().subtract(1, 'day').format("MMM Do YYYY") }, function (err, docs) {
      var pr = 0,
        upr = 0,
        ne = 0;
      docs.map((doc) => {
        var aData = doc.appData || {},
          aType = aData.type || '',
          aDur = aData.duration || 0;
        if (aType == 'p') {
          pr += aDur;
        } else if (aType == 'np') {
          upr += aDur;
        } else {
          ne += aDur;
        }
      })
      var sendData = {
        type: 'todayAppUsage',
        data: {
          prTime: pr,
          uprTime: upr,
          nTime: ne
        }
      };      
      mainWindow.webContents.send('dataReady', sendData);
    });
}

function getTimeHoursToday() {  
  var filePath = path.join(app.getPath('userData')  + ('/' + DB_NAME)),
    db = new DataStore({
      filename: filePath,
      autoload: true
    }),
    hourBreak = {
      0: 0,        
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
      7: 0,
      8: 0,
      9: 0,
      10: 0,
      11: 0,
      12: 0,
      13: 0,
      14: 0,
      15: 0,
      16: 0,
      17: 0,
      18: 0,
      19: 0,
      20: 0,
      21: 0,
      22: 0,
      23: 0        
    },
    prHourBreak = JSON.parse(JSON.stringify(hourBreak)),
    uprHourBreak = JSON.parse(JSON.stringify(hourBreak)),
    neHourBreak = JSON.parse(JSON.stringify(hourBreak));
    // TODO: REmove Sub
  db.find({ date: moment().subtract(1, 'day').format("MMM Do YYYY") }, function (err, docs) {      
    console.log(docs);
    docs.map((doc) => {
      var aData = doc.appData || {},
        aType = aData.type || '',
        aHour = doc.hour || 0, // TODO :Find a better way
        aDur = aData.duration || 0;        
        if (aType == 'p') {
          prHourBreak[aHour] += aDur;
        } else if (aType == 'np') {
          uprHourBreak[aHour] += aDur;
        } else {
          neHourBreak[aHour] += aDur;
        }
    });      
    var sendData = {
      type: 'timeToday',
      data: {
        prHourBreak: prHourBreak,
        uprHourBreak: uprHourBreak,
        neHourBreak: neHourBreak
      }
    };      
    mainWindow.webContents.send('dataReady', sendData);
  });  
}

function processString(str, isName = false) {
  // takes in a string, trims it, removes spaces, converts to lowercase and removes non-alphanumeric characters
  // If is Name is true, will remove the file extension
  if (isName) {
      str = str.split('.')[0];
  }
  str = str.trim();
  str = str.replace(/\s+/g, '');
  str = str.toLowerCase();
  return str.replace(/[^A-Za-z0-9]/g, '');        
}

function getUserDefinedAppName(sysName, sysTitle, aType) {
  var userConfig = configManager.getConfig(app.getPath('userData')),
    appMeta = userConfig.apps,
    aName = processString(sysName, true);
    aTitle = processString(sysTitle),
    getByTitle = function() {
      if (aType == 'p') {
        for (var i = 0; i < appMeta.productive.length; i++) { 
          var n = processString(appMeta.productive[i]);
          if (aTitle.includes(n)) {
              return n;
          }
        }
      } else if (aType == 'np') {
        for (var i = 0; i < appMeta.distraction.length; i++) {
          var n = processString(appMeta.distraction[i]);
          if (aTitle.includes(n)) {
              return n;
          }
        }
      }
      return aName;
    };

  if (aName === 'chrome') {
    // Use title to classify
    return getByTitle(aTitle);
  }

  if (aType == 'p') {
    return appMeta.productive[appMeta.productive.indexOf(aName)]
  } else if (aType == 'np') {
    return appMeta.distraction[appMeta.productive.indexOf(aName)]
  } else {
    return getByTitle(aTitle);
  }
}

function getUnProductiveApps() {
  var filePath = path.join(app.getPath('userData')  + ('/' + DB_NAME)),
    db = new DataStore({
      filename: filePath,
      autoload: true
    });    
  
    db.find({ date: moment().subtract(1, 'day').format("MMM Do YYYY") }, function (err, docs) {
      var prList = {};
      docs.map((doc) => {
        var aData = doc.appData || {},
          aName = aData.name || '',
          aTitle = aData.title || '',
          aType = aData.type || '',
          aDur = aData.duration || 0,
        uName = processString(aName, true);
        console.log(" FOr " + aName  + " ss " + uName)
        if (aType == 'np') {
          if (prList[uName]) {
            prList[uName] += aDur;
          } else {
            prList[uName] = aDur;
          }
        }
      })
      var sendData = {
        type: 'todayUprApps',
        data: {
          prList: prList
        }
      };
      mainWindow.webContents.send('dataReady', sendData);
    });
}

function getProductiveApps() {
  var filePath = path.join(app.getPath('userData')  + ('/' + DB_NAME)),
    db = new DataStore({
      filename: filePath,
      autoload: true
    });    
  
    db.find({ date: moment().subtract(1, 'day').format("MMM Do YYYY") }, function (err, docs) {
      var prList = {};
      docs.map((doc) => {
        var aData = doc.appData || {},
          aName = aData.name || '',
          aTitle = aData.title || '',
          aType = aData.type || '',
          aDur = aData.duration || 0,
        uName = processString(aName, true);
        console.log(" FOr " + aName  + " ss " + uName)
        if (aType == 'p') {     
          if (prList[uName]) {
            prList[uName] += aDur;
          } else {
            prList[uName] = aDur;
          }
        }
      })
      var sendData = {
        type: 'todayPrApps',
        data: {
          prList: prList
        }
      };
      mainWindow.webContents.send('dataReady', sendData);
    });
}

// =============== Data Collection Methods ===============

function startMonitor() {
  monitorP = fork('./core/monitor.js');
  listenToMonitor();
  if (monitorP) {
    console.log("Sending in ")
    monitorP.send({
      type: 'start',
      data: {
        userDataPath: app.getPath('userData')
      }
    })
  }
}

function killMonitor() {
  if (monitorP) {
    console.log("Killing the Monitor ... ");
    monitorP.kill();
    monitorP = '';
  }
  if (appState === WILL_EXIT) {
    console.log("All Cleanup Done !");
    app.exit(0);
  }
}

function stopMonitor() {  
  if (monitorP) {
    monitorP.send({
      type: 'stop',
      data: {}
    });
  }
}

function listenToMonitor() {
  monitorP.on('message', (m) => {
    console.log("From Monitor Child: " + m);
      var type = m.type || '',
          data = m.data || {};
      switch(type) {
          case 'stop-complete':
              killMonitor();
              break;        
          default:
              console.log(type + " not supported !");
              break;
  
      }
  });
}

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    backgroundColor: '#121212',
    width: 800,
    height: 600,
    show: false,
    center: true,
    resizable: false,
    title: "Boost",
    autoHideMenuBar: true,
    webPreferences: {
      // preload: path.join(__dirname, 'preload.js')      
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  mainWindow.webContents.on('new-window', function(e, url) {
    e.preventDefault();
    console.log("CLICk")
    require('electron').shell.openExternal(url);
  });
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  ipcMain.on('fromHome', (e, data) => {
    switch(data.type) {
      case 'start':
        console.log("Starting the Engine");
        // Start Monitor
        appState = STATE_TRACKING;
        startMonitor();
        break;
      case 'stop':
        console.log("Stopping the Engine");
        // Stop Monitor
        appState = STATE_IDLE;
        stopMonitor();
        break;
      default:
        console.log("Cannot Understand");
        break;        
    }
  });  

  ipcMain.on('getData', (e, data) => {
    console.log("Collecting Data..." + data.type);        
    switch(data.type) {
      case 'todayAppUsage':
        getTodayAppUsage();        
        break;
      case 'timeToday':
        getTimeHoursToday();
        break;
      case 'todayPrApps':
        getProductiveApps();
        break;
      case 'todayUprApps':
        getUnProductiveApps();
        break;
      default:
        console.log("Cannot Understand");
        break;        
    }
  });  


}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)

app.on('will-quit', function (e) {
  if (appState === STATE_TRACKING) {
    appState = WILL_EXIT;
    e.preventDefault();
    stopMonitor();
  }
})


// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
