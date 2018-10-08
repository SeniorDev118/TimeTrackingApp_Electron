import { app, BrowserWindow, screen, ipcMain, ipcRenderer } from 'electron';
import * as ioHook from 'iohook';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import { CronJob } from 'cron';
let win, serve, size, isTrack, keyboardCount, mouseCount, timerHandler, cronjobHandler, currentTaskId;
let readedFakeData, previousTimestamp;
let fakeDataSubscribeEvent, takeScreenshotEvent;
let screenshotUrls = [];
const args = process.argv.slice(1);
isTrack = false;
keyboardCount = 0;
mouseCount = 0;
currentTaskId = -1;
previousTimestamp = 0;
serve = args.some(val => val === '--serve');

function createWindow() {

  const electronScreen = screen;
  size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    // x: 0,
    // y: 0,
    width: 1280,
    height: 720,
    // width: 580,
    // height: 720,
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

  // win.webContents.openDevTools();

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

}

function updateTracks(timestamp, isForceClose = false) {
  if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
  }

  let jsonFilePath = path.join(__dirname, 'data/data.json');
  let timeDistance = Math.floor((timestamp - previousTimestamp) / 1000);
  previousTimestamp = timestamp;

  if (!isForceClose) {
    if (timeDistance > 57) {
      timeDistance = 60;
      takeScreenShots(currentTaskId, 60 * 1000);
    } else {
      takeScreenShots(currentTaskId, 60 * 1000, false);
    }
  } else {
    takeScreenShots(currentTaskId, 60 * 1000, false);
  }

  // update time, mouse count and keyboard count
  fs.readFile(jsonFilePath, (err, data) => {  
    if (err) {
      if (isForceClose) {
        clearData();
      }
      console.log('File opening Error');
      return;
    }
    let res = JSON.parse(data.toString());
    if (res['data'] && res['data'].length > 0) {
      for (let index = 0; index < res['data'].length; index ++) {
        if (res['data'][index]['id'] === currentTaskId) {
          if (isForceClose) {
            res['data'][index]['status'] = 'stop';
          }
          if (!res['data'][index]['timeLogs']) {
            res['data'][index]['timeLogs'] = {};
          }
          res['data'][index]['time'] += timeDistance;
          res['data'][index]['timeLogs'][timestamp] = {
            keyboardCount: keyboardCount,
            mouseCount: mouseCount
          };
          
          if (!res['data'][index]['screens']) {
            res['data'][index]['screens'] = [];
          }

          if (screenshotUrls.length > 0) {
            res['data'][index]['screens'] = res['data'][index]['screens'].concat(screenshotUrls);
          }
        }
      }
    }
    let json = JSON.stringify(res); //convert it back to json
    fs.writeFile(jsonFilePath, json, 'utf8', function(err) {
      if (err) {
        if (isForceClose) {
          clearData();
        }
        console.log('Writing in data.json is fail');
      }
      console.log('Success to write in data.json');
      fakeDataSubscribeEvent.sender.send('update-fake-data-subscribe-reply', res['data']);
      screenshotUrls = [];
      if (isForceClose) {
        clearData();
      }
    });
  });
}

function takeScreenShots(taskId, during, isLoop = true) {
  if (!isLoop) {
    takeScreenshotEvent.sender.send('take-screenshot-reply', taskId);
    return;
  }
  // take 3 screenshot in random
  for (let index = 0; index < 3; index ++) {
    let time = Math.random() * during;
    setTimeout(() => {
      takeScreenshotEvent.sender.send('take-screenshot-reply', taskId); 
    }, time);
  }
}

function changeTaskStatus(status) {
  if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
  }
  let jsonFilePath = path.join(__dirname, 'data/data.json');
  fs.readFile(jsonFilePath, (err, data) => {
    if (err) {
      console.log('Opening a file is failed');
      return;
    }
    let res = JSON.parse(data.toString());
    if (res['data'] && res['data'].length > 0) {
      for (let index = 0; index < res['data'].length; index ++) {
        if (res['data'][index]['id'] === currentTaskId) {
          res['data'][index]['status'] = status;
        }
      }
      let json = JSON.stringify(res); //convert it back to json
      fs.writeFile(jsonFilePath, json, 'utf8', function(err) {
        if (err) {
          console.log('Updating a status in data.json is failed');
          return;
        }
        console.log('Success to update a status in data.json');
        fakeDataSubscribeEvent.sender.send('update-fake-data-subscribe-reply', res['data']);
      });
    }
  });
}

// stop interval
function stopInterval() {
  if (timerHandler) {
    clearInterval(timerHandler);
  }
}

// clear data
function clearData() {
  isTrack = false;
  mouseCount = 0;
  keyboardCount = 0;
  previousTimestamp = 0;
  screenshotUrls = [];
  isTrack = false;
  currentTaskId = -1;
  stopInterval();
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

  let cronjobHandler = new CronJob('0 */1 * * * *', function() {
    if (isTrack) {
      let timestamp = Date.now();
      updateTracks(timestamp);
    }
  }, null, true, 'America/Los_Angeles');

  ipcMain.on('get-window-size', (event, arg) => {
    event.sender.send('get-window-size-reply', size);
  });

  ipcMain.on('update-fake-data-subscribe', (event, arg) => {
    fakeDataSubscribeEvent = event;
  });

  ipcMain.on('take-screenshot', (event, arg) => {
    takeScreenshotEvent = event;
  });

  ipcMain.on('get-fake-data', (event, arg) => {
    let jsonFilePath = path.join(__dirname, 'data/data.json');
    fs.readFile(jsonFilePath, (err, data) => {  
      if (err) {
        readedFakeData = [];
        return event.sender.send('get-fake-data-reply', {
          status: false
        });
      }

      let res = JSON.parse(data.toString());
      readedFakeData = res['data'] ? res['data'] : [];
      return event.sender.send('get-fake-data-reply', {
        status: true,
        data: res['data']
      });
    });
  });

  ipcMain.on('create-fake-data', (event, arg) => {
    readedFakeData.push(arg);
    let backup = readedFakeData;
    if (!fs.existsSync(path.join(__dirname, 'data'))) {
      fs.mkdirSync(path.join(__dirname, 'data'));
    }

    let json = JSON.stringify({data: readedFakeData}); //convert it back to json
    let jsonFilePath = path.join(__dirname, 'data/data.json');
    fs.writeFile(jsonFilePath, json, 'utf8', function(err) {
      if (err) {
        console.log('Updating in data.json is failed');
        readedFakeData = backup;
        return event.sender.send('create-fake-data-reply', {
          status: false,
          data: readedFakeData
        });
      }
      console.log('Success to add in data.json');
      return event.sender.send('create-fake-data-reply', {
        status: true,
        data: readedFakeData
      });
    });
    
  });

  // build a screenshot
  ipcMain.on('build-screenshot', (event, arg) => {
    let base64Data = arg['data'].replace(/^data:image\/png;base64,/, '');
    let taskId = arg['taskId'];
    if (!fs.existsSync(path.join(__dirname, 'data/snips'))) {
      fs.mkdirSync(path.join(__dirname, 'data/snips'));
    }
    let timestamp = Date.now();
    let imagePath = `data/snips/${timestamp}.png`;
    fs.writeFile(path.join(__dirname, imagePath), base64Data, 'base64', function(err) {
      if (err) {
        return event.sender.send('build-screenshot-reply', {
          status: false
        });
      }
      screenshotUrls.push({
        timestamp: timestamp,
        imagePath: imagePath
      });
      return event.sender.send('build-screenshot-reply', {
        status: true,
        taskId: taskId,
        screenshotUrls: screenshotUrls
      });
    });
  });

  // start to track
  ipcMain.on('start-screenshot', (event, arg) => {
    isTrack = true;
    currentTaskId = arg['taskId'];
    // startTimer(event, arg['intervalSeconds'] * 1000, arg['taskId']);
    previousTimestamp = Date.now();
    
    changeTaskStatus('start');
  });

  // stop to track
  ipcMain.on('stop-screenshot', (event, arg) => {
    updateTracks(Date.now(), true);
    event.sender.send('stop-screenshot-reply', arg['taskId'])
  });

  ioHook.on('keydown', event => {
    if (isTrack) {
      keyboardCount ++;
    }
  });

  ioHook.on('mousedown', event => {
    if (isTrack) {
      mouseCount ++;
    }
  });

  // Register and start hook
  ioHook.start(false);
  console.log('ipcRenderer, ', ipcRenderer);

} catch (e) {console.log('error: ', e);
  // Catch Error
  // throw e;
}
