const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
} = require('electron');
const http = require('http');
const path = require('path');

// https://github.com/electron/windows-installer/blob/0336cc646af849f125979ba623efdf5440852c4e/README.md#handling-squirrel-events
// this should be placed at top of main.js to handle setup events quickly
if (handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
}

function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }

  const ChildProcess = require('child_process');
  const path = require('path');

  const appFolder = path.resolve(process.execPath, '..');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
  const exeName = path.basename(process.execPath);

  const spawn = function (command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, { detached: true });
    } catch (error) { }

    return spawnedProcess;
  };

  const spawnUpdate = function (args) {
    return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      // Install desktop and start menu shortcuts
      spawnUpdate(['--createShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Remove desktop and start menu shortcuts
      spawnUpdate(['--removeShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated

      app.quit();
      return true;
  }
}

class AuthManager {
  constructor(config) {
    this.tray = null;
    this.server = null;
    this.win = null;
    this.token = null;
    this.username = null;

    this.loggedOutIcon = config.loggedOutIcon;
    this.loggedInIcon = nativeImage.createFromPath(
      path.join(__dirname, 'img', 'coin-16x16.png')
    );

    this.ipc = ipcMain;

    // Electron runs an old node version, no auto-binding in this env.
    this.createContextMenu = this.createContextMenu.bind(this);
    this.createWindow = this.createWindow.bind(this);
    this.handleIpcMessage = this.handleIpcMessage.bind(this);
    this.requestListener = this.requestListener.bind(this);
    this.startHttpServer = this.startHttpServer.bind(this);
    this.startup = this.startup.bind(this);
    this.quit = this.quit.bind(this);
    this.quitHttpServer = this.quitHttpServer.bind(this);
    this.updateContextMenu = this.updateContextMenu.bind(this);
    this.updateTrayIcon = this.updateTrayIcon.bind(this);
  }

  createContextMenu() {
    if (this.token) {
      return Menu.buildFromTemplate([
        { label: `Logged in as: ${this.username}`, click: this.createWindow },
        { label: 'Quit', click: this.quit },
      ]);
    } else {
      return Menu.buildFromTemplate([
        { label: 'Login', click: this.createWindow },
        { label: 'Quit', click: this.quit },
      ]);
    }
  }

  createWindow() {
    if (this.win) {
      //don't create another window (process) if existing window is hidden
      this.win.show();
      return false;
    }
    this.win = new BrowserWindow({
      width: 600,
      height: 400,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    this.win.loadFile('index.html');
    //this.win.webContents.openDevTools();

    this.win.on('minimize', (event) => {
      event.preventDefault();
      this.win.hide();
    });

    this.win.on('activate', (event) => {
      event.preventDefault();
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      } else {
        this.win.show();
      }
    });

    this.win.on('close', (event) => {
      if (!app.isQuiting) {
        event.preventDefault();
        this.win.hide();
      } else {
        console.log('quitting');
      }

      return false;
    });

    // Quit when all windows are closed, except on macOS. There, it's common
    // for applications and their menu bar to stay active until the user quits
    // explicitly with Cmd + Q.
    this.win.on('window-all-closed', (event) => {
      if (process.platform !== 'darwin') {
        app.quit();
      }

      return false;
    });
  }

  handleIpcMessage(event, msg) {
    this.token = msg.token;
    this.username = msg.username;
    this.updateContextMenu();
    this.updateTrayIcon();
    // reply to the ui that we're good
    event.sender.send('asynchronous-reply', {
      status: 200,
      username: this.username,
    });
  }

  requestListener(req, res) {
    if (this.token) {
      res.writeHead(200);
      res.end(this.token);
    } else {
      res.writeHead(404);
      res.end('');
    }
  }

  startHttpServer() {
    this.server = http.createServer(this.requestListener);
    this.server.listen(50123);
  }

  startup() {
    if (!app.requestSingleInstanceLock()) {
      this.quit();
    }
    this.tray = new Tray(this.loggedOutIcon);
    //this.updateContextMenu();
    this.updateTrayIcon();
    this.startHttpServer();
    this.ipc.on('asynchronous-message', this.handleIpcMessage);
    this.createWindow();
    this.ipc.on('error', () => {
      // this will bring the app window to the foreground
      // and login will be preseted to user
      app.relaunch()
      app.exit()
    });
  }

  quit() {
    app.exit(0);
  }

  quitHttpServer() {
    this.server.close();
  }

  updateContextMenu() {
    this.tray.setContextMenu(this.createContextMenu());
  }

  updateTrayIcon() {
    if (this.token) {
      this.tray.setImage(this.loggedInIcon);
      this.tray.setToolTip('tokn - CWBI Auth (Logged In)');
    } else {
      this.tray.setImage(this.loggedOutIcon);
      this.tray.setToolTip('tokn - CWBI Auth (Logged Out)');
    }
    this.updateContextMenu();
  }
}

app.whenReady().then(() => {
  const auth = new AuthManager({
    loggedOutIcon: nativeImage.createFromPath(
      path.join(__dirname, 'img', 'coin-16x16-inactive.png')
    ),
  });
  auth.startup();
});
