const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
} = require('electron');
const https = require('https');
const path = require('path');

const cert = `
LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURVakNDQWpvQ0NRQ21EMm1GdzVPc2pEQU5C
Z2txaGtpRzl3MEJBUXNGQURCck1Rc3dDUVlEVlFRR0V3SlYKVXpFTE1Ba0dBMVVFQ0F3Q1RrZ3hF
REFPQmdOVkJBY01CMGhoYm05MlpYSXhHVEFYQmdOVkJBb01FRlZUUVVORgpMVVZTUkVNdFExSlNS
VXd4RGpBTUJnTlZCQXNNQlZKVFIwbFRNUkl3RUFZRFZRUUREQWxzYjJOaGJHaHZjM1F3CkhoY05N
akl3TlRJd01EQXdNVFV3V2hjTk16SXdOVEU1TURBd01UVXdXakJyTVFzd0NRWURWUVFHRXdKVlV6
RUwKTUFrR0ExVUVDQXdDVGtneEVEQU9CZ05WQkFjTUIwaGhibTkyWlhJeEdUQVhCZ05WQkFvTUVG
VlRRVU5GTFVWUwpSRU10UTFKU1JVd3hEakFNQmdOVkJBc01CVkpUUjBsVE1SSXdFQVlEVlFRRERB
bHNiMk5oYkdodmMzUXdnZ0VpCk1BMEdDU3FHU0liM0RRRUJBUVVBQTRJQkR3QXdnZ0VLQW9JQkFR
Q3FYc1VJL2w1cmlveCtHc1c5aDdTaHdxWUIKelV3azdRckhRVldjd055cFpqcUZGTkhwVUNxdGI1
WmgyNG45OTRzZDBuajgweHZiaHNSbU5qSjRyaTArQ3gyUgovblNsNXlkQUp2WVJwd3lSR2lWcGsv
aFdKVmlQZ05vR1VtS1RWZVA4bE53aERFWVZCandERUFoSHRFdWszMEZRClo4YmwyK01yUTBEK05Z
OWY3bmkzaGp2VEMrSlFURnhVVmtsM3FsMFpFelE0emk4UWJONnRxWUpEenVIcG90enoKSEFlQVp4
U2Y3SUVtM25wdXdDVWs1Wk9KWkFnVE5QRkF2ejBwUUFqYWVrbFdacUdwZWpHQVpxZm5jNHZnNkdj
Qwp2Y2UxMGlUUnFWSkc2UUxIWkRsZXZSK09zSXpvdDlxeDVlOTlvUDJXaStyVFVUZVdwSzZWeUFQ
WUU3bExBZ01CCkFBRXdEUVlKS29aSWh2Y05BUUVMQlFBRGdnRUJBSDU5UTNxd3FpQjZKQXFqNWgz
ZUY3b3h3OVUzM3QyYys0YW4Ka1J0S0E3TnBxV0JBQUpCRzk5R1FvZVdYMC85dHZDUnYvZ2twcDJp
MzFMZEdvNU1rSnRkR1h4S1ZTSHQ5NGo5VwpWODcwb2w5UmZpNWo1dWI3SVdjTFpOZkJUdGZ3bWZx
NC8xa1ZXdHo0dlRsb0RJSWxzaHZUUHpDLzNuMGh3bGEwCklWYnlNVS9NN1U0Y2grcDZKcktrcFY2
Q1hTVkFKRGxaY0lMRzJGdHJzQmdxZXlMWjhMbGRYaG83ZVNVekFYU04KeVJhem5qMzY4NlBybDA0
VFJkVHMwSXo5bFhkL0QxbXl5bEo3M1kxa1NVVjJGL1o3MUhBRTlub3FJczQ1eStwWAozYVU1MjNh
OWNwNHcyYzNmMlYvcnZTUnFGNDk5Y0ViZGF3SmxyTGhWZitzam5JbFZ1WDQ9Ci0tLS0tRU5EIENF
UlRJRklDQVRFLS0tLS0`;

const pk = `
LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2UUlCQURBTkJna3Foa2lHOXcwQkFRRUZB
QVNDQktjd2dnU2pBZ0VBQW9JQkFRQ3FYc1VJL2w1cmlveCsKR3NXOWg3U2h3cVlCelV3azdRckhR
Vldjd055cFpqcUZGTkhwVUNxdGI1WmgyNG45OTRzZDBuajgweHZiaHNSbQpOako0cmkwK0N4MlIv
blNsNXlkQUp2WVJwd3lSR2lWcGsvaFdKVmlQZ05vR1VtS1RWZVA4bE53aERFWVZCandECkVBaEh0
RXVrMzBGUVo4YmwyK01yUTBEK05ZOWY3bmkzaGp2VEMrSlFURnhVVmtsM3FsMFpFelE0emk4UWJO
NnQKcVlKRHp1SHBvdHp6SEFlQVp4U2Y3SUVtM25wdXdDVWs1Wk9KWkFnVE5QRkF2ejBwUUFqYWVr
bFdacUdwZWpHQQpacWZuYzR2ZzZHY0N2Y2UxMGlUUnFWSkc2UUxIWkRsZXZSK09zSXpvdDlxeDVl
OTlvUDJXaStyVFVUZVdwSzZWCnlBUFlFN2xMQWdNQkFBRUNnZ0VBWGRaL0Rqb1V4WVQxWnd2VitG
T0RzVWtsNkg0c1AzWjBabFZkRTA3QysyYjgKT29yQ0o1RHBRTWZpZTVuUlFwb1MvT1VOa0t1eWYx
S1dZSG5maU1yZXpucU8yZmZlUmZhd2pzd200b2d4Q3Nicwo3bDc2L0cvcmZIY0xIMHBIVTBHT3Bu
TlRYN3lENlZhYXZWRWFUbXhHOGRPcUJPQjBFK3p1RGNrb1JodzRFU3pBCm5iNTdtN2E1clZiWXBz
RUhqbVJEem9Rd3VqUjE1b1FrSmNjLzVCaFJIbkVIQzZGcDhuK1dudjFGeGZQREcycDEKWXMzbmJt
MGtXK3RMa21XQ040cXo3Q2ZyWUVLMk45V0QzMTZ1YisxeTN4Qk9naGlvenkrMks5YldHeG1GQ09t
UAp1dE5vaUJOYm5DOGJSNkwyWDluMXRPSlRpKzVRWWVXNi9mb2FmZEw2aVFLQmdRRGdGSVQvODN6
U1ZvVndQWVkyCnU4eS9FL25pdHhESDh0Q2Y4bGdseG9POEZ4NmxXSE9wemFpaEJCNW9jUXlGYWNo
b3BFakVNYXcybThLbWs3ME8KakVNWEpDSGYrNEhjWllxYzdzRlEvandQdCs5QVBGcUV1S1FxWDN6
VSsxTEdHRmJzNS8vQkZjTVowTHZVWjdLUQppTGhDS3UzV2M0TmhTUkJiNmg4T2p4OEp0d0tCZ1FE
Q281OEIxTGhLNDNSdG1WZmxvZ0NmT2lQWFdDRTNBc0o4CnpTNEVZRDVFWS95UXBZcG53VnRWT3I2
alBKbVBvMUl1bW85ajQ2NkZxclc3c0dYZXVMSjBIdnRjVndjaWtGcWsKcnNwQk5sWUNxYy80bzN5
ZmszOTc4U25DYUVNeUlvcDlQemo1RnJteHd3blp4bkdZbUQ0ZHFPOUpmQUtLNjdBTAozYmIwVmMy
ZERRS0JnUURNMGZTLy85QVljdjJGbXJjVFVKWFdFbXhXenY2SHhXcnN5SmZKNzZwNlFxZkFleGsr
CkhMNEdiNzFidWZtMytQazJyUFBXWVpFSVdWZVM2M2ZqMUZGKzFZZ2hNOE4vc1ZFQ0lUcVN6ZEFZ
amdnaXJ3Z08KU0xmR0E0SVhLNko5YjhJRXlncjhjdWZpc09qL1BjbjZVdjRaZlNQbzRhMDFQNU8w
Y0V2ekF0OWNBUUtCZ0FYUwo4WW9UZkdRNVJCMlhiZ3JmK3hiSW5aUHUvaWR3UExPUlRDUXpZUW1Z
MkZEWHN6bUJqcU1STyswVWZoL1BLa0ZjCnZKZW5rMnhLZkYrZVdwMzhkdEtFcnM3SGg5NGY1YVp4
MkhsMUQ4UEtvdjkwbk9FRmY5WU1sRXhONUZ6V3JjQXIKcVIvQzcxR0RYWU1YcmdSNzRiZnZleUYr
eFhDMHRyTFVNb3BER3dEdEFvR0FUeUdXVk9weTRXR1JrWmIzL0FjLwpIUjVaUmJWbE02QVVxSElD
VFVzSlFiTHZhMFladUMwOFVaOVA2L1cxNTMwZC9Xd2w1S1RuYlc1cEcvaDN3djJWClZkNEIzWG5i
SmlXUHorUnhmRHNuNEluaDJnTHNxZ0VUbFFWQk1PVTQvOC9ZOWZJNW1oVVJoUDFaRFcxMzhFbjUK
T1p3eTdEK0owbndrcE5hMW5pTkN2MjA9Ci0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0`;

// Only auto-update on Windows, Mac requires signed app
if (process.platform === 'win32') {
  require('update-electron-app')({
    updateInterval: '1 hour',
  });
}

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
    } catch (error) {}

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
    this.startHttpsServer = this.startHttpsServer.bind(this);
    this.startup = this.startup.bind(this);
    this.quit = this.quit.bind(this);
    this.quitHttpsServer = this.quitHttpsServer.bind(this);
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
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        devTools: false,
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

  startHttpsServer() {
    // Creating object of key and certificate for SSL
    this.options = {
      key: Buffer.from(pk, 'base64').toString('utf8'),
      cert: Buffer.from(cert, 'base64').toString('utf8'),
    };
    this.server = https
      .createServer(this.options, this.requestListener)
      .listen(50123, 'localhost');
  }

  startup() {
    if (!app.requestSingleInstanceLock()) {
      this.quit();
    }
    this.tray = new Tray(this.loggedOutIcon);
    //this.updateContextMenu();
    this.updateTrayIcon();
    this.startHttpsServer();
    this.ipc.on('asynchronous-message', this.handleIpcMessage);
    this.createWindow();
    this.ipc.on('error', () => {
      // this will bring the app window to the foreground
      // and login will be preseted to user
      app.relaunch();
      app.exit();
    });
  }

  quit() {
    app.exit(0);
  }

  quitHttpsServer() {
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
