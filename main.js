const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
} = require("electron");
const http = require("http");

class AuthManager {
  constructor(config) {
    this.tray = null;
    this.server = null;
    this.win = null;
    this.token = null;
    this.username = null;

    this.loggedOutIcon = config.loggedOutIcon;
    this.loggedInIcon = nativeImage.createFromPath("./img/shield-check.png");

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
        { label: `Logged in as: ${this.username}` },
        { label: "Quit", click: this.quit },
      ]);
    } else {
      return Menu.buildFromTemplate([
        { label: "Login", click: this.createWindow },
        { label: "Quit", click: this.quit },
      ]);
    }
  }

  createWindow() {
    this.win = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    this.win.loadFile("index.html");
    // this.win.webContents.openDevTools();

    this.win.on("minimize", (event) => {
      event.preventDefault();
      this.win.hide();
    });

    this.win.on("close", (event) => {
      if (!app.isQuiting) {
        event.preventDefault();
        this.win.hide();
      } else {
        console.log("quitting");
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
    event.sender.send("asynchronous-reply", {status:200,username:this.username});
  }

  requestListener(req, res) {
    if (this.token) {
      res.writeHead(200);
      res.end(this.token);
    } else {
      res.writeHead(404);
      res.end("");
    }
  }

  startHttpServer() {
    this.server = http.createServer(this.requestListener);
    this.server.listen(50123);
  }

  startup() {
    this.tray = new Tray(this.loggedOutIcon);
    this.updateContextMenu();
    this.startHttpServer();
    this.ipc.on("asynchronous-message", this.handleIpcMessage);
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
    }
  }
}

app.whenReady().then(() => {
  const auth = new AuthManager({
    loggedOutIcon: nativeImage.createFromPath("./img/shield-key.png"),
  });
  auth.startup();
});
