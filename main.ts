import { app, BrowserWindow, screen, ipcMain, desktopCapturer } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
let win, serve, size;
const args = process.argv.slice(1);
serve = args.some(val => val === '--serve');

function createWindow() {

  const electronScreen = screen;
  size = electronScreen.getPrimaryDisplay().workAreaSize;
  console.log('size: ', size);

  // Create the browser window.
  win = new BrowserWindow({
    // x: 0,
    // y: 0,
    width: 1280,
    height: 720,
    center: true,
    minWidth: 1024,
    minHeight: 565
    // width: size.width,
    // height: size.height
  });

  if (serve) {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`)
    });
    win.loadURL('http://localhost:4200');
  } else {
    win.loadURL(url.format({
      pathname: path.join(__dirname, 'dist/index.html'),
      protocol: 'file:',
      slashes: true
    }));
  }

  win.webContents.openDevTools();

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

}


try {

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createWindow);

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

  ipcMain.on('get-window-size', (event, arg) => {
    event.sender.send('get-window-size-reply', size)
  });

  ipcMain.on('send-screenshot', (event, arg) => {
    let base64Data = arg.replace(/^data:image\/png;base64,/, "");
    fs.writeFile(path.join(__dirname, 'snips/image.png'), base64Data, 'base64', function(err) {
      if (err) {
        return event.sender.send('send-screenshot-reply', false);
      }
      return event.sender.send('send-screenshot-reply', true);
    });
  });

} catch (e) {
  // Catch Error
  // throw e;
}
