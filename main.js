// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron')
const path = require('path')

const { fork } = require('child_process');

var monitorP = ''; // child process

function startMonitor() {
  monitorP = fork('./core/monitor.js');
  if (monitorP) {
    console.log("Sending in ")
    monitorP.send({
      type: 'start',
      data: {}
    })
  }
}

function stopMonitor() {
  if (monitorP) {
      monitorP.send({
        type: 'stop',
        data: {}
      })    
  }
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

  // Start Monitor
  startMonitor();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  stopMonitor();
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
