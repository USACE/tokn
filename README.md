# TOKN

**Enable CAC or Login.gov based authentication for local scripts for API access**

This is a little helper app designed to run in the application try letting users log into CWBI authentication services so that tokens can be used by local scripts to access authenticated web APIs.

## Development

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
git clone https://github.com/USACE/tokn.git
# Go into the repository
cd tokn
# Install dependencies, make sure dev dependencies get installed
npm install
# Run the app
npm start
```

Note: If you're using Linux Bash for Windows, [see this guide](https://www.howtogeek.com/261575/how-to-run-graphical-linux-desktop-applications-from-windows-10s-bash-shell/) or use `node` from the command prompt.

## Resources for Learning Electron

- [electronjs.org/docs](https://electronjs.org/docs) - all of Electron's documentation
- [electronjs.org/community#boilerplates](https://electronjs.org/community#boilerplates) - sample starter apps created by the community
- [electron/electron-quick-start](https://github.com/electron/electron-quick-start) - a very basic starter Electron app
- [hokein/electron-sample-apps](https://github.com/hokein/electron-sample-apps) - small demo apps for the various Electron APIs

## Packaging for distribution

`npm run make`

## License

[CC0 1.0 (Public Domain)](LICENSE.md)
