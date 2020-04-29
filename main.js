// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path');

const { fork } = require('child_process');


const STATE_IDLE = 'idle',
  STATE_TRACKING = 'tracking',
  WILL_EXIT = 'will_exit';

var monitorP = '', // child process
  appState = STATE_IDLE;

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
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // preload: path.join(__dirname, 'preload.js')
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  mainWindow.webContents.on('new-window', function(e, url) {
    e.preventDefault();
    console.log("CLICk")
    require('electron').shell.openExternal(url);
  });

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
