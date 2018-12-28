import { app, BrowserWindow, screen, ipcMain, Tray, Menu, shell, nativeImage } from 'electron';
import * as ioHook from 'iohook';
import * as path from 'path';
import * as url from 'url';
import * as moment from 'moment';
import { CronJob } from 'cron';
import { notify } from 'node-notifier';
let win, serve, size, isTrack, keyboardCount, mouseCount, screenshotTimerHandlers, settingData;
let takeScreenshotEvent, createNewActivityEvent, trayControlEvent, tray, selectProjectEvent, controlEvent;
let hourCronjobHandler, trackingIntervalHandler, engagementIntervalHandler, checkTrackOnHandler;
let contextMenu, currentTaskId, currentProjectId, selectedTaskId, selectedProjectId, previousTimestamp;
let idleSettingTimeInMins, lastTrackTimestamp, idleTimeInMilliSecs, lastProjectTimestamp, lastEngagementPer;
let projectsDetail, selectedProject, menuTemplate;
let trackingTimeIntervalMins, engagementTimeIntervalMins;
lastTrackTimestamp = 0;
lastProjectTimestamp = 0;
idleTimeInMilliSecs = 0;
keyboardCount = 0;
mouseCount = 0;
lastEngagementPer = 0;
currentTaskId = -1;
currentProjectId = -1;
selectedTaskId = -1;
selectedProjectId = -1;
previousTimestamp = 0;
trackingTimeIntervalMins = 0;
engagementTimeIntervalMins = 0;

isTrack = false;

settingData = {};
projectsDetail = {};
selectedProject = {};
menuTemplate = [];
screenshotTimerHandlers = [];

const args = process.argv.slice(1);
serve = args.some(val => val === '--serve');


function createWindow() {

  const electronScreen = screen;
  size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    // x: 0,
    // y: 0,
    // width: 1280,
    // height: 720,
    width: 472,
    height: 667,
    center: true,
    icon: nativeImage.createFromPath(path.join(__dirname, '/icons/256x256.png')),
    minWidth: 472,
    minHeight: 667,
    maxWidth: 472,
    maxHeight: 667,
    maximizable: false,
    minimizable: false
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

  createTrayMenu();
  initData();

  win.webContents.openDevTools();

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    // win.close();
    if (win) {
      win = null;
    }
  });

}

/**
 * init data
 */
function initData() {
  idleTimeInMilliSecs = 0;
  projectsDetail = {};
  // customNotify('Test', 'Test');
}

/**
 * notification function
 * @param title: notification title
 * @param message: notification message
 */
function customNotify(title, message) {
  notify({
    title: title,
    message: message
  }, (err, res) => {
  });
}

/**
 * update track
 * @param projectId: project id
 * @param taskId: task id
 * @param timestamp: timestamp
 */
function updateTracks(projectId, taskId, timestamp) {
  const newActivity = createNewActivity(projectId, taskId, timestamp);
  createNewActivityEvent.sender.send('create-new-activity-reply', newActivity);
  console.log('---create activity---');
  console.log(newActivity);
  if (settingData['notify_me_screenshot']) {
    customNotify('Time Tracker', 'Screenshot taken');
  }
}

/**
 * create new activity
 * @param projectId: project id
 * @param taskId: task id
 * @param timestamp: timestamp
 */
function createNewActivity(projectId, taskId, timestamp) {
  let duration = Math.floor((timestamp - previousTimestamp) / 1000);

  if (duration > (trackingTimeIntervalMins * 60 - 3)) {
    duration = trackingTimeIntervalMins;
  }

  const status = (idleTimeInMilliSecs >= idleSettingTimeInMins * 60 * 1000) ? 'idle' : 'engaged';

  const newActivity = {
    status: status,
    project_id: projectId,
    task_id: taskId < 0 ? null : taskId,
    duration: duration,
    mode: 'AUTOMATIC',
    reason: 'task interval screenshot detail done',
    date: moment(new Date(timestamp)).format('YYYY-MM-DD HH:mm:ss'),
    from_time: moment(new Date(previousTimestamp)).format('YYYY-MM-DD HH:mm:ss'),
    to_time: moment(new Date(timestamp)).format('YYYY-MM-DD HH:mm:ss'),
    screenshot_urls: [],
    mouse_click_count: mouseCount,
    keyboard_count: keyboardCount
  };

  mouseCount = 0;
  keyboardCount = 0;
  previousTimestamp = timestamp;
  return newActivity;
}

/**
 * clear screenshots intervals
 */
function clearScreenshotsIntervals() {
  for (let index = 0; index < 3; index ++) {
    if (screenshotTimerHandlers[index]) {
      clearInterval(screenshotTimerHandlers[index]);
    }
  }
}

/**
 * clear tracking data
 */
function clearTrackData() {
  isTrack = false;
  mouseCount = 0;
  keyboardCount = 0;
  previousTimestamp = 0;
  currentTaskId = -1;
  currentProjectId = -1;
  selectedTaskId = -1;
  clearScreenshotsIntervals();
}

/**
 * check if current weekday is inside target ones
 * @param weekDayString: weekdays string
 */
function checkWeekday(weekDayString) {
  const currentWeekday = moment().isoWeekday();
  const defaultWeekDays = ['', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const weekDays = weekDayString.trim().toLowerCase().split(',');
  return (weekDays.indexOf(defaultWeekDays[currentWeekday]) > -1);
}

/**
 * check if current time is in track on time
 * @param startTime: start time
 * @param endTime: end time
 */
function checkTrackOnTime(startTime, endTime) {
  if (moment(new Date()).format('HH:mm:ss') >= startTime && moment(new Date()).format('HH:mm:ss') <= endTime) {
    return true;
  }

  return false;
}

/**
 * check track on status
 */
function checkTrackOnStatus() {
  if (settingData['untracked_for_in_min']) {
    if (checkTrackOnHandler) {
      clearInterval(checkTrackOnHandler);
    }

    const interval = parseInt(settingData['untracked_for_in_min'], 10) * 60 * 1000;
    checkTrackOnHandler = setInterval(() => {
      if (
        settingData['notify_me_track_on'] &&
        checkWeekday(settingData['track_on']) &&
        checkTrackOnTime(settingData['start_time'], settingData['end_time'])
      ) {
        if (!isTrack) {
          customNotify('Time Tracker', 'Rimnider: You\'re not tracking time.');
        }
      }
    }, interval);
  }
}

/**
 * calculate idle time
 */
function calcuateIdleTime() {
  if (lastTrackTimestamp !== 0) {
    const diffInMilliSecs = Math.abs(lastTrackTimestamp - Date.now());
    if (diffInMilliSecs >= idleSettingTimeInMins * 60 * 1000) { // idle setting time in a minute format
      idleTimeInMilliSecs += diffInMilliSecs;
    }

    lastTrackTimestamp = Date.now();
  }
}

/**
 * calculate engagement percentage
 */
function calculateEngagementPer() {
  const hourInMilliSeconds = 60 * 60 * 1000;
  return Math.abs((hourInMilliSeconds - idleTimeInMilliSecs) / hourInMilliSeconds * 100);
}

/**
 * process time tracking
 * @param trackingIntervalInMiniSecs tracking interval time
 */
function processTimeTrack(trackingIntervalInMiniSecs) {
  for (let index = 0; index < 3; index ++) {
    const randomInterval = Math.floor(Math.random() * trackingIntervalInMiniSecs);
    console.log('random time: ', randomInterval);
    // random interval start
    screenshotTimerHandlers[index] = setTimeout(() => {
      if (isTrack) {
        takeScreenshotEvent.sender.send('take-screenshot-reply');
      }
    }, randomInterval);
    // random interval end
  }

  if (isTrack) {
    // increase timer
    if (projectsDetail.hasOwnProperty(selectedProjectId)) {
      const current = Date.now();
      const diffInMilliSecs = current - lastProjectTimestamp;
      projectsDetail[selectedProjectId]['time'] += diffInMilliSecs;
      lastProjectTimestamp = current;
      buildProjectInfo();
    }

    updateTracks(currentProjectId, currentTaskId, Date.now());
  }
}

/**
 * clear all kinds of time interval handlers
 */
function clearTimeIntervals() {
  if (trackingIntervalHandler) {
    clearInterval(trackingIntervalHandler);
  }

  if (engagementIntervalHandler) {
    clearInterval(engagementIntervalHandler);
  }

  clearScreenshotsIntervals();
}

/**
 * start time intervals
 */
function startTimeIntervals() {
  // tracking cron job
  if (trackingTimeIntervalMins <= 0) {
    console.log('Tracking interval is less than 0');
    return;
  }

  const trackingIntervalInMiniSecs = parseInt(trackingTimeIntervalMins, 10) * 60 * 1000;
  console.log('trackingTimeIntervalMins: ', trackingTimeIntervalMins, trackingIntervalInMiniSecs);
  processTimeTrack(trackingIntervalInMiniSecs);

  // tracking interval start
  trackingIntervalHandler = setInterval(() => {
    console.log('tracking interval running:');
    processTimeTrack(trackingIntervalInMiniSecs);
  }, trackingIntervalInMiniSecs);
  // tracking interval end

  // engagement cron job
  if (engagementTimeIntervalMins <= 0) {
    console.log('Tracking interval is less than 0');
    return;
  }

  const egIntervalInMiniSecs = parseInt(engagementTimeIntervalMins, 10) * 60 * 1000;
  console.log('engagementTimeIntervalMins: ', engagementTimeIntervalMins, egIntervalInMiniSecs);

  engagementIntervalHandler = setInterval(() => {
    console.log('engagement interval running:');
    calcuateIdleTime();
  }, egIntervalInMiniSecs);
}

/**
 * convert seconds to hh:mm
 * @param secs: seconds
 */
function makeTrayTime(secs) {
  const hours =  Math.floor(Math.floor(secs / 3600));
  const minutes = Math.floor(Math.floor((secs - (hours * 3600)) / 60));
  // const seconds = Math.floor((secs - ((secs * 3600) + (minutes * 60))) % 60);

  const dHours = (hours > 9 ? hours : '0' + hours);
  const dMins = (minutes > 9 ? minutes : '0' + minutes);
  return dHours + ':' + dMins;
}

/**
 * build project information like code and timer
 */
function buildProjectInfo() {
  if (projectsDetail && selectedProjectId && projectsDetail[selectedProjectId]) {
    const timeInMiniSecs = parseInt(projectsDetail[selectedProjectId]['time'], 10);
    const projectTimer = makeTrayTime(Math.floor(timeInMiniSecs / 1000));
    if (contextMenu && menuTemplate.length > 0) {
      menuTemplate[1].visible = true;
      menuTemplate[1].label = `${selectedProject['code']} ${projectTimer}`;
      contextMenu = Menu.buildFromTemplate(menuTemplate);
      tray.setContextMenu(contextMenu);
    }
  } else {
    if (contextMenu && menuTemplate.length > 0) {
      menuTemplate[1].visible = false;
      contextMenu = Menu.buildFromTemplate(menuTemplate);
      tray.setContextMenu(contextMenu);
    }
  }
}

/**
 * update engagement
 * @param engagementPer: engagement percentage?
 */
function updateEngagement(engagementPer) {
  const endHour = moment().format('hh a');
  const startHour = moment().subtract(1, 'hours').format('hh a');
  return `Engagement(${startHour} - ${endHour}) ${engagementPer}% ${engagementPer - lastEngagementPer}%`;
}

/**
 * create tray menu
 */
function createTrayMenu() {
  /**
   * Set tray icon
   */
  const iconPath = path.join(__dirname, 'icons', '16x16.png');

  tray = new Tray(iconPath);
  menuTemplate = [
    {
      label: updateEngagement(0)
    },
    {
      label: '',
      visible: false
    },
    {
      type: 'separator'
    },
    {
      label: 'Timer is running',
      click: () => {
        if (currentProjectId >= 0 && trayControlEvent) {
          trayControlEvent.sender.send('tray-icon-control-reply', {
            status: 'stop',
            taskId: currentTaskId,
            projectId: currentProjectId
          });
        }
      },
      icon: path.join(__dirname, 'icons', 'pause.png'),
      visible: false
    },
    {
      label: 'Timer is paused',
      click: () => {
        if (selectedProjectId >= 0 && trayControlEvent) {
          trayControlEvent.sender.send('tray-icon-control-reply', {
            status: 'start',
            taskId: selectedTaskId,
            projectId: selectedProjectId
          });
        }
      },
      icon: path.join(__dirname, 'icons', 'play.png'),
      enabled: false
    },
    {
      type: 'separator'
    },
    {
      label: 'Switch Projects',
    },
    {
      type: 'separator'
    },
    {
      label: 'Add a note',
      click: () => {
        controlEvent.sender.send('control-event-reply', {type: 'note'});
        win.focus();
      },
      enabled: false
    },
    {
      type: 'separator'
    },
    {
      label: 'Open Dashboard',
      click: () => {
        shell.openExternal('https://tracklyapp.appup.cloud/trackly/#/430/1587/dashboard');
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Settings',
      click: () => {
        controlEvent.sender.send('control-event-reply', {type: 'setting'});
        win.focus();
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'About Track.ly',
      click: () => {
        shell.openExternal('https://www.track.ly/');
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Help',
      click: () => {
        controlEvent.sender.send('control-event-reply', {type: 'help'});
        win.focus();
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Check for updates',
      click: () => {
        controlEvent.sender.send('control-event-reply', {type: 'check'});
        win.focus();
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Sign out',
      click: () => {
        controlEvent.sender.send('control-event-reply', {type: 'signout'});
        menuTemplate[4].enabled = false;
        win.focus();
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Quit tracker',
      click: () => {
        if (win) {
          win = null;
        }

        app.quit();
      }
    }
  ];

  contextMenu = Menu.buildFromTemplate(menuTemplate);
  tray.setContextMenu(contextMenu);
  tray.setToolTip('Time Tracker');
}

/**
 * select project
 */
function selectProject() {
  if (selectedProjectId < 0) {
    console.log('selected project id is wrong');
    return;
  }

  console.log('selectedProject: ', selectedProjectId)
  selectedProject = projectsDetail[selectedProjectId]['data'];
  console.log('current selected project: ', selectedProject)
  idleSettingTimeInMins = selectedProject['ideal_time_interval_mins'] ? parseInt(selectedProject['ideal_time_interval_mins'], 10) : 0;
  trackingTimeIntervalMins = selectedProject['time_interval_mins'] ? parseInt(selectedProject['time_interval_mins'], 10) : 0;
  engagementTimeIntervalMins = selectedProject['engagement_interval_mins'] ?
    parseInt(selectedProject['engagement_interval_mins'], 10) : 0;
  clearTimeIntervals();
  startTimeIntervals();
  lastProjectTimestamp = Date.now();

  if (!isTrack) { // if timer is stopped
    if (tray && menuTemplate.length > 0) {
      // hide stop tray menu
      menuTemplate[3].visible = false;
      // Show start tray menu
      menuTemplate[4].visible = true;
      menuTemplate[4].enabled = true;
      contextMenu = Menu.buildFromTemplate(menuTemplate);
      tray.setContextMenu(contextMenu);
    }
  }

  buildProjectInfo();
}

/**
 * select project or task
 * @param idInfo projectId-taskId
 */
function selectProjectTask(idInfo) {
  const arr = idInfo.split('-');
  if (arr.length === 1) { // project case
    selectedProjectId = parseInt(arr[0], 10);
    selectProject();
    console.log('selectedProject: ', selectedProjectId)
  } else if (arr.length === 2) { // task case
    selectedProjectId = parseInt(arr[0], 10);
    selectedTaskId = parseInt(arr[1], 10);
    selectProject();
    console.log('selectedTask: ', selectedProjectId, selectedTaskId)
  }
}

/**
 * build project tray menu
 * @param projects: projects
 * @param tasks: tasks
 */
function buildProjectMenu(projects, tasks) {
  let projectSubMenu = [];
  if (projects.length > 0) {
    projectSubMenu = projects.map((project) => {
      const projectTasks = [];
      for (let index = 0; index < tasks.length; index ++) {
        if (parseInt(tasks[index]['project_id'], 10) === parseInt(project['id'], 10)) {
          projectTasks.push({
            id: project['id'] + '-' + tasks[index]['id'],
            label: tasks[index]['description'],
            click: (menuItem: Object) => {
              selectProjectTask(menuItem['id']);
            }
          });
        }
      }

      const returnItem = {
        id: project['id'],
        label: project['name'],
        click: (menuItem: Object) => {
          selectProjectTask(menuItem['id']);
        }
      };

      if (projectTasks.length > 0) {
        returnItem['submenu'] = projectTasks;
      }

      return returnItem;
    });
  }
  return projectSubMenu;
}

/**
 * round number
 * @param value: value
 * @param ndec: dec
 */
function round(value, ndec) {
  let n = 10;
  for (let i = 1; i < ndec; i++) {
    n *= 10;
  }

  if (!ndec || ndec <= 0) {
    return Math.round(value);
  } else {
    return Math.round(value * n) / n;
  }
}

/**
 * destroy ipcMain listeners and cron job handler
 */
function destroyListners() {
  if (ipcMain) {
    ipcMain.removeAllListeners('get-current-ids');
    ipcMain.removeAllListeners('get-selected-ids');
    ipcMain.removeAllListeners('get-window-size');
    ipcMain.removeAllListeners('take-screenshot');
    ipcMain.removeAllListeners('select-task');
    ipcMain.removeAllListeners('start-track');
    ipcMain.removeAllListeners('stop-track');
    ipcMain.removeAllListeners('create-new-activity');
    ipcMain.removeAllListeners('tray-icon-control');
    ipcMain.removeAllListeners('select-project');
    ipcMain.removeAllListeners('control-event');
  }

  if (trackingIntervalHandler) {
    clearInterval(trackingIntervalHandler);
  }

  if (engagementIntervalHandler) {
    clearInterval(engagementIntervalHandler);
  }

  if (checkTrackOnHandler) {
    clearInterval(checkTrackOnHandler);
  }

  if (hourCronjobHandler) {
    hourCronjobHandler.stop();
  }
}

// function parseCookies (rc) {
//   var list = {};

//   rc && rc.split(';').forEach(function( cookie ) {
//     var parts = cookie.split('=');
//     list[parts.shift().trim()] = decodeURI(parts.join('='));
//   });

//   return list;
// }

try {

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createWindow);

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    // if (process.platform !== 'darwin') {

    // }
    app.quit();
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

  app.on('before-quit', (evt) => {
    if (tray) {
      tray.destroy();
      tray = null;
    }
    ioHook.stop();
    ioHook.unload();
    destroyListners();
  });

  /**
   * Cron Job for Engagement
   */
  hourCronjobHandler = new CronJob('0 0 */1 * * *', () => {

    if (contextMenu && menuTemplate.length > 0) {
      console.log('engagement cronjob running:');
      const engagementPer = round(calculateEngagementPer(), 2);
      menuTemplate[0].label = updateEngagement(engagementPer);
      contextMenu = Menu.buildFromTemplate(menuTemplate);
      tray.setContextMenu(contextMenu);
      lastEngagementPer = engagementPer;
      idleTimeInMilliSecs = 0;
    }

    // check the reset time
    const currentTime = new Date();
    const currentHours = currentTime.getHours();
    const currentMinutes = currentTime.getMinutes();

    if (currentHours === 0 && currentMinutes === 0) {
      for (const key in projectsDetail) {
        if (projectsDetail.hasOwnProperty(key)) {
          projectsDetail[key]['time'] = 0;
        }
      }
    }
  }, null, true);

  /**
   * ipcMain lisner to get current task id and project id
   */
  ipcMain.on('get-current-ids', (event, arg) => {
    event.sender.send('get-current-ids-reply', {
      currentTaskId: currentTaskId,
      currentProjectId: currentProjectId
    });
  });

  /**
   * ipcMain lisner to get selected task id and project id
   */
  ipcMain.on('get-selected-ids', (event, arg) => {
    event.sender.send('get-selected-ids-reply', {
      selectedTaskId: selectedTaskId,
      selectedProjectId: selectedProjectId
    });
  });

  /**
   * ipcMain lisner to get current desktop window size
   */
  ipcMain.on('get-window-size', (event, arg) => {
    event.sender.send('get-window-size-reply', size);
  });

  /**
   * ipcMain lisner to get screenshot event
   */
  ipcMain.on('take-screenshot', (event, arg) => {
    takeScreenshotEvent = event;
  });

  /**
   * ipcMain lisner to get control event
   */
  ipcMain.on('control-event', (event, arg) => {
    controlEvent = event;
  });

  /**
   * ipcMain lisner to get task id selected
   */
  ipcMain.on('select-task', (event, arg) => {
    if (currentProjectId < 0 && currentTaskId < 0) {
      selectedTaskId = parseInt(arg['taskId'], 10);
      selectedProjectId = parseInt(arg['projectId'], 10);
      event.sender.send('get-selected-ids-reply', {
        selectedTaskId: selectedTaskId,
        selectedProjectId: selectedProjectId
      });

      if (tray && menuTemplate.length > 0) {
        menuTemplate[3].visible = false;
        menuTemplate[4].visible = true;
        menuTemplate[4].enabled = true;
        contextMenu = Menu.buildFromTemplate(menuTemplate);
        tray.setContextMenu(contextMenu);
      }
    }
  });

  /**
   * ipcMain lisner to quit the app
   */
  ipcMain.on('quit-app', (event, arg) => {
    if (win) {
      win = null;
    }

    app.quit();
  });

  /**
   * ipcMain lisner to get start time tracking event
   */
  ipcMain.on('start-track', (event, arg) => {
    if (currentTaskId >= 0 && currentProjectId >= 0) {
      if (currentTaskId !== arg['taskId'] || currentProjectId !== arg['projectId']) {
        isTrack = false;
        if (tray && menuTemplate.length > 0) {
          menuTemplate[3].visible = false;
          menuTemplate[4].visible = true;
          menuTemplate[4].enabled = true;
          contextMenu = Menu.buildFromTemplate(menuTemplate);
          tray.setContextMenu(contextMenu);
        }
        updateTracks(currentProjectId, currentTaskId, Date.now());
        clearTrackData();
      }
    }

    isTrack = true;
    lastTrackTimestamp = Date.now();

    if (tray && menuTemplate.length) {
      menuTemplate[3].visible = true;
      menuTemplate[4].visible = false;
      contextMenu = Menu.buildFromTemplate(menuTemplate);
      tray.setContextMenu(contextMenu);
    }

    currentTaskId = arg['taskId'];
    selectedTaskId = arg['taskId'];
    currentProjectId = arg['projectId'];
    selectedProjectId = arg['projectId'];
    previousTimestamp = Date.now();
    // takeScreenShots(currentTaskId, trackingTimeIntervalMins * 60 * 1000, true);
    event.sender.send('start-track-reply', {
      currentTaskId: currentTaskId,
      currentProjectId: currentProjectId,
      selectedTaskId: selectedTaskId,
      selectedProjectId: selectedProjectId
    });
  });

  /**
   * ipcMain lisner to get stop time tracking event
   */
  ipcMain.on('stop-track', (event, arg) => {
    if (isTrack) {
      updateTracks(arg['projectId'], arg['taskId'], Date.now());
      clearTrackData();

      if (tray && menuTemplate.length > 0) {
        menuTemplate[3].visible = false;
        menuTemplate[4].visible = true;
        contextMenu = Menu.buildFromTemplate(menuTemplate);
        tray.setContextMenu(contextMenu);
      }

      event.sender.send('stop-track-reply', {
        currentTaskId: currentTaskId,
        currentProjectId: currentProjectId,
        selectedTaskId: selectedTaskId,
        selectedProjectId: selectedProjectId
      });
    }
  });

  /**
   * ipcMain lisner to update setting
   */
  ipcMain.on('update-setting', (event, arg) => {
    settingData = arg['setting'];
    checkTrackOnStatus();
  });

  /**
   * ipcMain lisner to select project
   */
  ipcMain.on('select-project', (event, arg) => {
    const current = Date.now();
    selectProjectEvent = event;
    selectedProject = arg['project'];

    if (selectedProject['id']) { // if project is selected
      selectedProjectId = selectedProject['id'];
      idleSettingTimeInMins = selectedProject['ideal_time_interval_mins'] ? parseInt(selectedProject['ideal_time_interval_mins'], 10) : 0;
      trackingTimeIntervalMins = selectedProject['time_interval_mins'] ? parseInt(selectedProject['time_interval_mins'], 10) : 0;
      engagementTimeIntervalMins = selectedProject['engagement_interval_mins'] ?
        parseInt(selectedProject['engagement_interval_mins'], 10) : 0;
      clearTimeIntervals();
      startTimeIntervals();
      lastProjectTimestamp = current;
      if (tray && menuTemplate.length > 0) {
        menuTemplate[3].visible = false;
        menuTemplate[4].visible = true;
        menuTemplate[4].enabled = true;
        contextMenu = Menu.buildFromTemplate(menuTemplate);
        tray.setContextMenu(contextMenu);
      }
      buildProjectInfo();
    } else { // if any project is not selected
      if (
        isTrack &&
        Object.keys(selectedProject).length !== 0 &&
        selectedProject['id'] &&
        projectsDetail.hasOwnProperty(selectedProject['id'])
      ) { // if there is previous selected project
        const diffInMilliSecs = current - lastProjectTimestamp;
        projectsDetail[selectedProject['id']]['time'] += diffInMilliSecs;
      }

      selectedProject = {};
      selectedProjectId = -1;
      if (tray) {
        if (tray && menuTemplate.length > 0 && !isTrack) {
          menuTemplate[1].visible = false;
          menuTemplate[3].visible = false;
          menuTemplate[4].visible = true;
          menuTemplate[4].enabled = false;
          contextMenu = Menu.buildFromTemplate(menuTemplate);
          tray.setContextMenu(contextMenu);
        }
      }
    }
  });

  /**
   * ipcMain lisner to get all projects and tasks
   */
  ipcMain.on('get-all-projects-tasks', (event, arg) => {
    let projectSubMenu = [];

    if (arg['projects'] && arg['projects'].length > 0) {
      for (let index = 0; index < arg['projects'].length; index ++) {
        if (arg['projects'][index] && arg['projects'][index]['id']) {
          if (!projectsDetail.hasOwnProperty(arg['projects'][index]['id'])) {
            projectsDetail[arg['projects'][index]['id']] = {
              time: 0
            };
          }

          projectsDetail[arg['projects'][index]['id']]['data'] = arg['projects'][index];
        }
      }

      projectSubMenu = buildProjectMenu(arg['projects'], arg['tasks']);
    }

    if (tray && menuTemplate.length > 3) {
      if (projectSubMenu.length > 0) {
        menuTemplate[6].submenu = projectSubMenu;
      }

      contextMenu = Menu.buildFromTemplate(menuTemplate);
      tray.setContextMenu(contextMenu);
    }
  });

  /**
   * ipcMain activity lisner
   */
  ipcMain.on('activity-notification', (event, arg) => {
    if (tray && menuTemplate.length > 0) {
      menuTemplate[8].enabled = true;
      contextMenu = Menu.buildFromTemplate(menuTemplate);
      tray.setContextMenu(contextMenu);
    }
  });

  /**
   * ipcMain lisner to get event of tray icon control
   */
  ipcMain.on('tray-icon-control', (event, arg) => {
    trayControlEvent = event;
  });

  /**
   * ipcMain lisner to get event of new activity creation
   */
  ipcMain.on('create-new-activity', (event, arg) => {
    createNewActivityEvent = event;
  });

  /**
   * ioHook listener to get key down event
   */
  ioHook.on('keydown', event => {
    if (isTrack) {
      keyboardCount ++;
      lastTrackTimestamp = Date.now();
    }
  });

  /**
   * ioHook listener to get mouse down event
   */
  ioHook.on('mousedown', event => {
    if (isTrack) {
      mouseCount ++;
      lastTrackTimestamp = Date.now();
    }
  });

  // Register and start hook
  ioHook.start(false);

} catch (e) {
  console.log('error: ', e);
  // Catch Error
  // throw e;
}
