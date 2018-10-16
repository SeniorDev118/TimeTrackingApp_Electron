import { app, BrowserWindow, screen, ipcMain, Tray, Menu } from 'electron';
import * as ioHook from 'iohook';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import * as request from 'request';
import { CronJob } from 'cron';
let win, serve, size, isTrack, keyboardCount, mouseCount, timerHandler, cronjobHandler;
let takeScreenshotEvent;
let contextMenu, currentToken, currentTaskId, currentProjectId, previousTimestamp;
let screenshotUrls = [];
const spanSeconds = 60;
const apiUrl = 'https://tracklyapp.appup.cloud';
const args = process.argv.slice(1);
isTrack = false;
keyboardCount = 0;
mouseCount = 0;
currentTaskId = -1;
currentProjectId = -1;
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
  const iconPath = path.join(__dirname, 'tray.png');

  // const tray = new Tray(iconPath)
  // contextMenu = Menu.buildFromTemplate([
  //   {
  //     label: 'Start',
  //     click: function() {
  //       if (currentTaskId >= 0) {
  //         previousTimestamp = Date.now();
  //         changeTaskStatus('start');
  //         contextMenu.items[0].enabled = false;
  //         contextMenu.items[1].enabled = true;
  //       }
  //     }
  //   },
  //   {
  //     label: 'Stop',
  //     click: function() {
  //       if (currentTaskId >= 0) {
  //         updateTracks(currentTaskId, Date.now(), true);
  //         contextMenu.items[0].enabled = true;
  //         contextMenu.items[1].enabled = false;
  //       }
  //     }
  //   },
  //   // {
  //   //   label: 'Quit',
  //   //   accelerator: 'Command+Q',
  //   //   click: function() {
  //   //     app.quit();
  //   //   }
  //   // }
  // ]);
  // tray.setToolTip('Time Tracker');
  // tray.setContextMenu(contextMenu);
  // if (contextMenu) {
  //   contextMenu.items[0].enabled = false;
  //   contextMenu.items[1].enabled = false;
  // }

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
    Destroy();
  });

}

/**
 * 
 * @param url 
 * @param method
 * @param headers
 * @param formData
 */
function httpCall(url, method, headers, formData = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    if (method === 'POST') {
      request.post({
        headers: headers,
        url: `${apiUrl}/${url}`,
        form: formData,
        agentOptions: {
          rejectUnauthorized: false
        }
      }, (err, resp, body) => {
        console.log('--POST method---');
        console.log('error:', err);
        console.log(resp.headers);
        console.log('statusCode: ', resp.statusCode);
        if (!err && resp.statusCode === 200) {
          return resolve({
            resp: resp,
            body: body
          });
        } else {
          return reject();
        }
      });
    } else if (method === 'GET') {
      request.get({
        headers: headers,
        url: `${apiUrl}/${url}`,
        agentOptions: {
          rejectUnauthorized: false
        }
      }, (err, resp, body) => {
        console.log('--Get method---');
        console.log('error:', err);
        console.log('statusCode: ', resp.statusCode);
        console.log('body:', body);
        if (!err && resp.statusCode === 200) {
          return resolve({
            resp: resp,
            body: body
          });
        } else {
          return reject();
        }
      });
    }
  });
}

function formatDate(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var seconds = date.getSeconds();
  hours = hours < 10 ? '0' + hours : hours;
  minutes = minutes < 10 ? '0'+minutes : minutes;
  seconds = seconds < 10 ? '0'+seconds : seconds;
  var strTime = hours + ':' + minutes + ':' + seconds;
  var years = date.getFullYear();
  var months = date.getMonth() + 1;
  var dates = date.getDate();
  return years + '-' + months + '-' + dates + ' ' + strTime;
}

/**
 * 
 * @param taskId 
 * @param timestamp 
 * @param isForceClose 
 */
function updateTracks(projectId, taskId, timestamp): Promise<any> {
  return new Promise((resolve, reject) => {
    let duration = Math.floor((timestamp - previousTimestamp) / 1000);

    if (duration > 57) {
      duration = spanSeconds;
      // takeScreenShots(taskId, spanSeconds * 1000);
    } else {
      // takeScreenShots(taskId, spanSeconds * 1000, false);
    }

    const newActivity = {
      project_id: projectId,
      task_id: taskId,
      duration: duration,
      mode: 'MANUAL',
      reason: 'task interval screenshot detail done',
      date: formatDate(new Date(timestamp)),
      from_time: formatDate(new Date(previousTimestamp)),
      to_time: formatDate(new Date(timestamp)),
      screenshot_url: '',
      mouse_click_count: mouseCount,
      keyboard_count: keyboardCount
    };
    previousTimestamp = timestamp;
    console.log('---create activity---');
    console.log(newActivity);
  
    // update time, mouse count and keyboard count
    httpCall(
      '/trackly/create/activity',
      'POST',
      {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      newActivity
    ).then((res) => {console.log('--success--');
      resolve();
    }).catch(() => {console.log('--failed--');
      reject();
    });
  });
}

/**
 * take screenshots of desktop from UI
 * @param during 
 * @param isLoop 
 */
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

function Destroy() {
  if (ipcMain) {
    ipcMain.removeAllListeners('get-window-size');
    ipcMain.removeAllListeners('take-screenshot');
    ipcMain.removeAllListeners('build-screenshot');
    ipcMain.removeAllListeners('select-task');
    ipcMain.removeAllListeners('start-screenshot');
    ipcMain.removeAllListeners('stop-screenshot');
  }

  if (cronjobHandler) {
    cronjobHandler.stop();
  }
}

function parseCookies (rc) {
  var list = {};

  rc && rc.split(';').forEach(function( cookie ) {
      var parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURI(parts.join('='));
  });

  return list;
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

  cronjobHandler = new CronJob('0 */1 * * * *', function() {
    console.log('cronjob running:');
    if (isTrack) {
      // updateTracks(currentTaskId, timestamp);
      updateTracks(currentProjectId, currentTaskId, Date.now());
    }
  }, null, true, 'America/Los_Angeles');

  ipcMain.on('get-window-size', (event, arg) => {
    event.sender.send('get-window-size-reply', size);
  });

  ipcMain.on('take-screenshot', (event, arg) => {
    takeScreenshotEvent = event;
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

  // selected a task
  ipcMain.on('select-task', (event, arg) => {
    currentTaskId = arg;
    if (contextMenu) {
      contextMenu.items[0].enabled = true;
      contextMenu.items[1].enabled = false;
    }
    event.sender.send('select-task-reply', arg);
  });

  // start to track
  ipcMain.on('start-screenshot', (event, arg) => {
    isTrack = true;
    const currentTimestamp = Date.now();
    currentToken = arg['token'];
    currentTaskId = arg['taskId'];
    currentProjectId = arg['projectId'];

    previousTimestamp = currentTimestamp;
    if (currentProjectId !== -1 && currentTaskId !== -1 && currentToken) {
      return event.sender.send('start-screenshot-reply', {
        status: true,
        taskId: arg['taskId'],
        projectId: arg['projectId']
      });
    } else {
      return event.sender.send('start-screenshot-reply', {
        status: false,
        taskId: arg['taskId'],
        projectId: arg['projectId']
      });
    }
  });

  // stop to track
  ipcMain.on('stop-screenshot', (event, arg) => {
    currentTaskId = arg['taskId'];
    currentProjectId = arg['projectId'];
    isTrack = false;
    updateTracks(currentProjectId, currentTaskId, Date.now());
    event.sender.send('stop-screenshot-reply', currentTaskId);
  });

  // login call
  ipcMain.on('login-call', (event, arg) => {
    if (arg && arg['url'] && arg['method'] && arg['headers']) {
      if (arg['method'] === 'POST' && !arg['formData']) {
        event.sender.send('login-call-reply', {
          success: false,
          msg: 'POST call requires form data.'
        });
        return;
      }

      httpCall(arg['url'], arg['method'], arg['headers'], arg['formData']).then((res) => {
        if (res['resp']['headers'] && res['resp']['headers']['set-cookie']) {
          let cookies = parseCookies(res['resp']['headers']['set-cookie'][0]);
          event.sender.send('login-call-reply', {
            success: true,
            msg: '',
            token: cookies['token']
          });
        } else {
          event.sender.send('login-call-reply', {
            success: false,
            msg: 'There is no cookie'
          });
        }
      }).catch(() => {
        event.sender.send('login-call-reply', {
          success: false,
          msg: 'There is no cookie'
        });
      });
    } else {
      event.sender.send('login-call-reply', {
        success: false,
        msg: 'The url, method or headers is not defined.'
      });
    }
  });

  // get all tasks
  ipcMain.on('tasks-call', (event, arg) => {
    httpCall(
      `/trackly/gets/tasks?target_table=projects&table_join_column=project_id&target_table_join_column=id&where=project_id=${arg['projectId']}`,
      'GET',
      {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${arg['token']}`
      }
    ).then((res) => {
      return event.sender.send('tasks-call-reply', {
        success: true,
        res: JSON.parse(res['body'])
      });
    }).catch(() => {
      return event.sender.send('tasks-call-reply', {
        success: false
      });
    });
  });

  // get all projects
  ipcMain.on('projects-call', (event, arg) => {
    httpCall(
      '/trackly/gets/projects',
      'GET',
      {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${arg['token']}`
      }
    ).then((res) => {
      return event.sender.send('projects-call-reply', {
        success: true,
        res: JSON.parse(res['body'])
      });
    }).catch(() => {
      return event.sender.send('projects-call-reply', {
        success: false
      });
    });
  });

  // get specific project
  ipcMain.on('project-call', (event, arg) => {
    httpCall(
      `/trackly/gets/projects?where=id=${arg['projectId']}`,
      'GET',
      {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${arg['token']}`
      }
    ).then((res) => {
      return event.sender.send('project-call-reply', {
        success: true,
        res: JSON.parse(res['body'])
      });
    }).catch(() => {
      return event.sender.send('project-call-reply', {
        success: false
      });
    });
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

} catch (e) {console.log('error: ', e);
  // Catch Error
  // throw e;
}
