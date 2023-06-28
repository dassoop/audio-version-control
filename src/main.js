const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const functions = require('./functions.js')

require('update-electron-app')({
  updateInterval: '5 minutes',
  logger: require('electron-log')
})

if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    minWidth: 800,
    minHeight: 600,
    resizable: true,
    backgroundColor: "#1c1c1c;",
    icon: "./assets/icon.png",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })


  aboutWindow = new BrowserWindow({
      width: 300,
      height: 300,
      resizable: false,
      backgroundColor: "#1c1c1c;",
      icon: path.join(__dirname, 'assets/Logo.png'),
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
      },
    })

  aboutWindow.loadFile(path.join(__dirname, './view/html/about.html'), 
  {
    query: { version: app.getVersion() },
  });

  aboutWindow.hide()
  var aboutShowing = false

  aboutWindow.on('close', (event) => {
    if (app.quitting) 
    {
      aboutWindow = null
    } 
    else
    {
      event.preventDefault();
      aboutWindow.hide();
      aboutShowing = false;
    }
  });

  var menu = Menu.buildFromTemplate([
    {
      label: 'Menu',
      submenu: [
        {
          label: 'About'
          ,click()
          {
              if (aboutShowing) 
              {
                aboutWindow.hide();
                aboutShowing = false;
              }
              else
              {
                aboutWindow.show();
                aboutShowing = true;
              }
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Exit'
          ,click()
          {
            app.quit()
          }
        }
      ]
    }
  ])
  Menu.setApplicationMenu(menu)

  ipcMain.handle('req', async (event, req) => {
  res = 
  {
    error: null,
    data: {}
  }

    return functions.req(req, res)
  })

  mainWindow.on('close', (event) => {
    if (app.quitting) 
    {
      mainWindow = null
    } 
    else
    {
      event.preventDefault()
      mainWindow.hide()
    }
  });
  
  mainWindow.loadFile(path.join(__dirname, './view/html/projects.html'));
};

app.on('ready', createWindow);
app.on('activate', () => { mainWindow.show() })
app.on('before-quit', () => app.quitting = true)

app.whenReady().then(() => {

}) 

