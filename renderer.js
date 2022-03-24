// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
const { ipcRenderer } = require('electron');
const urlencodeFormData = (fd) => new URLSearchParams([...fd]);
const app_version = require('./package.json').version;
console.log(app_version);

class Keycloak {
  constructor(config) {
    this.accessToken = null;
    this.identityToken = null;
    this.config = config;
    this.authCallback = config.onAuthenticate;
    this.errCallback = config.onError;
    this.sessionEndWarning = config.sessionEndWarning || 60;
    this.sessionEndingCallback = config.onSessionEnding;
    this.keycloakUrl = `${config.keycloakUrl}/realms/${config.realm}/protocol/openid-connect`;
  }

  refreshInterval(expiresIn) {
    if (this.config.refreshInterval) {
      return this.config.refreshInterval * 1000;
    } else {
      const interval = (expiresIn - 60) * 1000;
      if (interval <= 0) {
        console.log(
          `Warning: Invalid Refresh Interval of ${interval} computed for token that expires in ${expiresIn}`
        );
        return 3600 * 1000; //60 minutes
      }
      return interval;
    }
  }

  authenticate() {
    const url = `${this.config.keycloakUrl}/realms/${
      this.config.realm
    }/protocol/openid-connect/auth?response_type=code&client_id=${
      this.config.client
    }&scope=openid&redirect_uri=${
      this.config.redirectUrl
    }&nocache=${new Date().getTime()}`;
    window.location.href = url;
  }

  checkForSession() {
    const urlParams = new URLSearchParams(window.location.search);
    this.code = urlParams.get('code');
    this.session_state = urlParams.get('session_state');
    if (this.code && this.session_state) {
      this.codeFlowAuth(this.authcallback);
      window.history.pushState(null, null, document.location.pathname);
    }
  }

  fetchToken(formData) {
    console.log('setting fetchToken timeout');
    let timer = setTimeout(function () {
      console.log('fetchToken timeout');
      //send error back to main.js
      ipcRenderer.send('error', {
        msg: 'auth_timeout',
      });
    }, 600000);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', `${this.keycloakUrl}/token`, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    let self = this;
    let resp = null;
    xhr.onload = function () {
      clearTimeout(timer);
      console.log('clearing fetchToken timeout');
      switch (xhr.status) {
        case 400:
          self.accessToken = null;
          self.refreshToken = null;
          resp = JSON.parse(xhr.responseText);
          self.errCallback(resp);
          break;
        case xhr.status !== 200:
          resp = JSON.parse(xhr.responseText);
          self.errCallback(resp);
          break;
        default:
          let keycloakResp = {
            access_token: null,
            identify_token: null,
            refresh_expires_in: 0,
          };
          try {
            keycloakResp = JSON.parse(xhr.responseText);
          } catch (err) {
            console.log(`Error parsing authentication token: ${err}`);
          }
          self.accessToken = keycloakResp.access_token;
          self.identityToken = keycloakResp.identity_token;
          const remainingTime = keycloakResp.refresh_expires_in;
          if (remainingTime <= self.sessionEndWarning) {
            if (self.sessionEndingCallback)
              self.sessionEndingCallback(remainingTime);
          }
          setTimeout(function () {
            self.refresh(keycloakResp.refresh_token);
          }, self.refreshInterval(keycloakResp.expires_in));
          self.authCallback(keycloakResp.access_token);
      }
    };
    xhr.onerror = function () {
      // this can happen if the server is not reachable
      // or if the user was prompted for a PIN while the CAC
      // was removed and they click cancel on the cert dialog window
      //send error back to main.js
      ipcRenderer.send('error', {
        msg: 'auth_timeout',
      });
      if (xhr.responseText) {
        self.errCallback(JSON.parse(xhr.responseText));
      } else {
        self.errCallback({
          error: 'Unable to fetch the token due to a Network Error',
        });
      }
    };
    xhr.send(urlencodeFormData(formData));
  }

  codeFlowAuth() {
    console.log('fetching token');
    var data = new FormData();
    data.append('code', this.code);
    data.append('grant_type', 'authorization_code');
    data.append('client_id', this.config.client);
    data.append('redirect_uri', this.config.redirectUrl);
    this.fetchToken(data);
  }

  refresh(refreshToken) {
    console.log('refreshing token');
    var data = new FormData();
    data.append('refresh_token', refreshToken);
    data.append('grant_type', 'refresh_token');
    data.append('client_id', this.config.client);
    this.fetchToken(data);
  }

  directGrantAuthenticate(user, pass) {
    var data = new FormData();
    data.append('grant_type', 'password');
    data.append('client_id', this.config.client);
    data.append('scope', 'openid profile');
    data.append('username', user);
    data.append('password', pass);
    this.fetchToken(data);
  }

  directGrantX509Authenticate() {
    var data = new FormData();
    data.append('grant_type', 'password');
    data.append('client_id', this.config.client);
    data.append('scope', 'openid profile');
    data.append('username', '');
    data.append('password', '');
    this.fetchToken(data);
  }

  getAccessToken() {
    return this.accessToken;
  }

  getIdentityToken() {
    return this.identityToken;
  }
}

const tokenToObject = function (token) {
  let base64Url = token.split('.')[1];
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  let jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join('')
  );

  return JSON.parse(jsonPayload);
};

const auth = new Keycloak({
  keycloakUrl: 'https://auth.corps.cloud/auth/',
  realm: 'water',
  client: 'cumulus',
  onAuthenticate: () => {
    const token = auth.getAccessToken();
    const tokenDigest = tokenToObject(token);
    ipcRenderer.send('asynchronous-message', {
      username: tokenDigest.preferred_username,
      token: token,
    });
  },
});

function login() {
  auth.directGrantX509Authenticate();
}

const btn = document.getElementById('login');
btn.addEventListener('click', login);
const version = document.getElementById('version');
version.innerText = `v${app_version}`;

// Async message handler
ipcRenderer.on('asynchronous-reply', (event, msg) => {
  if (msg.status === 200) {
    btn.innerText = `Logged in as ${msg.username}`;
    btn.style.backgroundColor = 'green';
    // window.setTimeout(window.close, 500)
  }
});

// Async message sender
window.sendMsg = (msg) => {
  ipcRenderer.send('asynchronous-message', msg);
};
