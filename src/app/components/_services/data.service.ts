import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { Subject, Observable } from 'rxjs';
import { ElectronService } from '../../providers/electron.service';
import { MatDialog } from '@angular/material';
import { NoteComponent } from '../modals/note/note.component';
import { SettingModalComponent } from '../modals/setting-modal/setting-modal.component';
import { Router } from '@angular/router';
import { AlertService } from './alert.service';

@Injectable()
export class DataService {
  isTakingScreenShot: boolean; // taking screenshot flag
  isTracking: boolean;
  windowWidth: number; // window width
  windowHeight: number; // window height
  activityId: number; // activity id
  tasks: Object[]; // tasks
  screenshotUrls: Object[]; // screenshot urls for one activity
  projectSettings: Object[]; // project settings
  currentProject: Object; // current project detail
  currentSetting: Object; // setting data
  currentProjectId: number; // current project id
  currentTaskId: number; // current task id
  selectedTaskId: number; // selected task id
  selectedProjectId: number; // selected project id
  lastEngagementHour: number; // last engagement hour

  private tasksSubject: Subject<any>; // tasks subscription

  constructor(
    private _electronService: ElectronService,
    private _httpService: HttpService,
    private dialog: MatDialog,
    private _router: Router,
    private _alertService: AlertService
  ) {
    this.screenshotUrls = [];
    this.tasks = [];
    this.projectSettings = [];
    this.windowWidth = 0;
    this.windowHeight = 0;
    this.currentProjectId = -1;
    this.currentTaskId = -1;
    this.selectedTaskId = -1;
    this.selectedProjectId = -1;
    this.activityId = -1;
    this.currentProject = {};
    this.currentSetting = {};
    this.tasksSubject = new Subject();
    this.isTakingScreenShot = false;
    this.isTracking = false;
    this.lastEngagementHour = 0;

    this.getSetting().catch(() => console.log());
  }

  /**
   * set listeners
   */
  setAcitivityListener() {
    if (this._electronService.isElectron) {
      this._electronService.ipcRenderer.send('get-all-projects-tasks', {
        projects: [],
        tasks: []
      });
      /**
       * tray icon control
       */
      this._electronService.ipcRenderer.send('tray-icon-control', 'ping');
      this._electronService.ipcRenderer.on('tray-icon-control-reply', (event, arg) => {
        console.log('tray:', arg);
        if (arg['status'] === 'start') {
          this._electronService.ipcRenderer.send('start-track', {
            taskId: arg['taskId'],
            projectId: arg['projectId']
          });
        } else {
          this._electronService.ipcRenderer.send('stop-track', {
            taskId: arg['taskId'],
            projectId: arg['projectId']
          });
        }
      });

      /**
       * get current project and task id event
       */
      this._electronService.ipcRenderer.send('get-current-ids', 'ping');
      this._electronService.ipcRenderer.on('get-current-ids-reply', (event, arg) => {
        this.currentProjectId = parseInt(arg.currentProjectId, 10);
        this.currentTaskId = parseInt(arg.currentTaskId, 10);
        this.setTasksSubscribe();
      });

      /**
       * get selected project and task id event
       */
      this._electronService.ipcRenderer.send('get-selected-ids', 'ping');
      this._electronService.ipcRenderer.on('get-selected-ids-reply', (event, arg) => {
        this.selectedTaskId = parseInt(arg.selectedTaskId, 10);
        this.selectedProjectId = parseInt(arg.selectedProjectId, 10);
        this.setTasksSubscribe();
      });

      /**
       * get window size event
       */
      this._electronService.ipcRenderer.send('get-window-size', 'ping');
      this._electronService.ipcRenderer.on('get-window-size-reply', (event, arg) => {
        this.windowWidth = arg.width;
        this.windowHeight = arg.height;
      });

      /**
       * create new activity event
       */
      this._electronService.ipcRenderer.send('create-new-activity', 'ping');
      this._electronService.ipcRenderer.on('create-new-activity-reply', (event, arg) => {
        this.postActivity(arg);
      });

      /**
       * take screenshot event
       */
      this._electronService.ipcRenderer.send('take-screenshot', 'ping');
      this._electronService.ipcRenderer.on('take-screenshot-reply', (event, arg) => {
        console.log('take-screenshot-reply: ');
        this.isTakingScreenShot = true;
        this.takecreenshot();
      });

      /**
       * start track event
       */
      this._electronService.ipcRenderer.on('start-track-reply', (event, arg) => {
        console.log('start-track-reply:', arg);
        this.currentProjectId = arg['currentProjectId'];
        this.currentTaskId = arg['currentTaskId'];
        this.selectedProjectId = arg['selectedProjectId'];
        this.selectedTaskId = arg['selectedTaskId'];
        this.isTracking = true;

        if (this.tasks.length > 0) {
          for (let index = 0; index < this.tasks.length; index ++) {
            if (this.tasks[index]['id'] === this.currentTaskId) {
              this.tasks[index]['timerStatus'] = 'Active';
            }
          }
          this.setTasksSubscribe();
        }
      });

      /**
       * stop track event
       */
      this._electronService.ipcRenderer.on('stop-track-reply', (event, arg) => {
        console.log('stop-track-reply:', arg);

        if (this.tasks.length > 0) {
          for (let index = 0; index < this.tasks.length; index ++) {
            if (this.tasks[index]['id'] === this.currentTaskId) {
              this.tasks[index]['timerStatus'] = 'InActive';
            }
          }
        }

        this.currentProjectId = arg['currentProjectId'];
        this.currentTaskId = arg['currentTaskId'];
        this.selectedProjectId = arg['selectedProjectId'];
        this.selectedTaskId = arg['selectedTaskId'];
        this.isTracking = false;

        this.setTasksSubscribe();
      });

      /**
       * control event
       */
      this._electronService.ipcRenderer.send('control-event');
      this._electronService.ipcRenderer.on('control-event-reply', (event, arg) => {
        console.log('control-event-reply: ', arg);
        let config;
        switch (arg['type']) {
          case 'note':
            config = {
              width: '400px',
              disableClose: true
            };
            const noteDialogRef = this.dialog.open(NoteComponent, config);
            noteDialogRef.afterClosed().subscribe(result => {
              if (result['status']) {
                this.addNote(result['note']).then(() => {
                }).catch((error) => {
                  if (error) {
                    this._alertService.error('Please try again later.');
                  } else {
                    this._alertService.error('Empty activity.');
                  }
                });
              }
            });
            break;

          case 'setting':
            config = {
              width: '400px',
              disableClose: true,
              data: {
                getDataPromise: this.getSetting()
              }
            };
            const settingDialogRef = this.dialog.open(SettingModalComponent, config);
            settingDialogRef.afterClosed().subscribe(result => {
              if (result['status']) {
                this.updateSetting(result['data']).then(() => {
                }).catch(() => {
                  this._alertService.error('Please try again later.');
                });
              }
            });
            break;

          case 'about':
            this._router.navigate(['/about']);
            break;
          case 'help':
          this._router.navigate(['/help']);
            break;
          case 'check':
          this._router.navigate(['/check']);
            break;
          case 'signout':
            if (this.isTracking) {
              this.stopTrack();
            }
            localStorage.removeItem('userInformation');
            this._router.navigate(['/login']);
            break;

          default:
            break;
        }
      });
    }
  }

  /**
   * stop track
   */
  stopTrack() {
    if (this._electronService.isElectron) {
      this.isTracking = false;

      this._electronService.ipcRenderer.send('stop-track', {
        taskId: this.currentTaskId,
        projectId: this.currentProjectId
      });
    }
  }

  /**
   * set tasks of specific project
   * @param projectId: project id
   */
  setTasks(projectId: number) {
    this.tasks = [];
    this._httpService.getCall(
      `/trackly/gets/tasks?table_join_column=project_id&target_table1_join_column=id&where=tasks.project_id=${projectId}`
    ).then((res) => {
      console.log(res);
      if (res.data && res.data.length > 0) {
        this.tasks = res.data.map((item) => {
          item['timerStatus'] = 'InActive';
          if (this.currentProjectId === projectId && this.currentTaskId === item['id']) {
            item['timerStatus'] = 'Active';
          }
          return item;
        });
        this.setTasksSubscribe();
      } else {
        this.setTasksSubscribe();
      }
    }).catch((error) => {
      this.setTasksSubscribe();
    });
  }

  /**
   * get all project settings
   */
  getAllProjectSettings(): Promise<any> {
    return new Promise((resolve, reject) => {
      this._httpService.getCall('trackly/project-settings').then((res) => {
        if (res && res['data']) {
          return resolve(res['data']);
        } else {
          return resolve([]);
        }
      }).catch((error) => {
        console.log('Error to get project list', error);
        return reject(error);
      });
    });
  }

  /**
   * get all tasks for specific user
   */
  getAllTasks(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (localStorage.getItem('userInformation')) {
        const userInfo = JSON.parse(localStorage.getItem('userInformation'));
        if (userInfo && userInfo['id']) {
          this._httpService.getCall(
            `/trackly/gets/tasks`
          ).then((res) => {
            if (res && res['data']) {
              resolve(res['data']);
            } else {
              resolve([]);
            }
          }).catch((error) => {
            reject(error);
          });
        } else {
          reject();
        }
      } else {
        reject();
      }
    });
  }

  /**
   * get all projects and tasks
   */
  getAllProjectsTaks(): Promise<any> {
    return new Promise((resolve, reject) => {
      Promise.all([
        this.getAllProjectSettings(),
        this.getAllTasks()
      ]).then((res) => {
        this.projectSettings = res[0];
        this._electronService.ipcRenderer.send('get-all-projects-tasks', {
          projects: res[0],
          tasks: res[1]
        });
        return resolve(res);
      }).catch(() => {
        this.projectSettings = [];
        this._electronService.ipcRenderer.send('get-all-projects-tasks', {
          projects: [],
          tasks: []
        });
        return reject();
      });
    });
  }

  /**
   * get projects for specific user
   */
  // getAllProjects(): Promise<any> {
  //   return new Promise((resolve, reject) => {
  //     this._httpService.getCall('trackly/gets/projects').then((res) => {
  //       let projects;
  //       if (res && res['data']) {
  //         projects = res['data'];
  //       } else {
  //         projects = [];
  //       }
  //       this.projectsSubject.next({
  //         projects: projects
  //       });
  //       return resolve(projects);
  //     }).catch((error) => {
  //       console.log('Error to get project list', error);
  //       this.projectsSubject.next({
  //         projects: []
  //       });
  //       reject(error);
  //     });
  //   });
  // }

  /**
   * raise tasks subscribe
   */
  getTasksSubscribe(): Observable<any> {
    return this.tasksSubject.asObservable();
  }

  /**
   * send tasks subscribe
   */
  setTasksSubscribe() {
    this.tasksSubject.next({
      tasks: this.tasks,
      currentProjectId: this.currentProjectId,
      currentTaskId: this.currentTaskId,
      selectedProjectId: this.selectedProjectId,
      selectedTaskId: this.selectedTaskId
    });
  }

  /**
   * set project data
   * @param project: project data
   */
  setProject(project: Object) {
    this.currentProject = project;
    this._electronService.ipcRenderer.send('select-project', {
      project: this.currentProject
    });
  }

  /**
   * create activity
   * @param activity: activity data
   * @param nCount: count
   */
  postActivity(activity: Object, nCount: number = 0) {
    activity['screenshot_urls'] = this.screenshotUrls;
    console.log('new activity: ', activity);
    this._httpService.postCall(
      'trackly/create/activity',
      activity
    ).then((res) => {
      console.log('Activity creation is successful!');
      if (res && res['data'] && res['data']['GENERATED_KEY']) {
        this.activityId = res['data']['GENERATED_KEY'];
      } else {
        this.activityId = -1;
      }
      this._electronService.ipcRenderer.send('activity-notification', {
        activityId: this.activityId
      });
      this.clearData();
    }).catch((err) => {
      console.log('Activity creation error', err);
      if (err) {
        if (nCount < 20) {
          nCount ++;
          setTimeout(() => {
            this.postActivity(activity, nCount);
          }, 5 * 60 * 1000); // retry in 5 mins
        }
      }
    });
  }

  /**
   * set screenshot url
   * @param url: url
   */
  setScreenshotUrl(url: string) {
    this.screenshotUrls.push({
      url: url,
      timestamp: Date.now()
    });
    console.log('screenshot list: ', this.screenshotUrls);
    if (this.screenshotUrls.length > 3) {
      this.screenshotUrls.splice(0, 3);
    }
  }

  /**
   * clear local data
   */
  clearData() {
    this.screenshotUrls = [];
  }

  /**
   * build screenshot
   * @param preUrl: pre url of amazon
   * @param url: url
   */
  buildScreenshot(preUrl: string, url: string) {
    this.fullscreenScreenshot((blob) => {
      this._httpService.uploadFile(preUrl, blob, 'image/png').then((res) => {
        console.log('Uploading screenshot is successful!: ', url);
      }).catch((err) => {
        console.log(err);
      });
    });
  }

  /**
   * take screenshot of the desktop
   */
  takecreenshot(): Promise<any> {
    return new Promise((resolve, reject) => {
      const fileName = Date.now() + '_screenshot.png';
      this._httpService.postCall(
        `trackly/presign?file_name=${fileName}`).then((res) => {
          if (res.status === 200) {
            this.buildScreenshot(res.data['s3_presign_url'], res.data['s3_url']);
            this.setScreenshotUrl(res.data['s3_url']);
            this.isTakingScreenShot = false;
            return resolve(res.data['s3_url']);
          } else {
            return reject();
          }
        }).catch((err) => {
          console.log(err);
          return reject(err);
        });
    });
  }

  /**
   * screenshot action
   * @param callback: callback function
   */
  fullscreenScreenshot(callback: Function) {
    const that = this;
    const _callback = callback;

    const handleStream = (stream) => {
      // Create hidden video tag
      const video = document.createElement('video');
      video.style.cssText = 'position:absolute;top:-10000px;left:-10000px;';
      // Event connected to stream
      video.onloadedmetadata = function () {
        // Set video ORIGINAL height (screenshot)
        video.style.height = that.windowHeight + 'px'; // videoHeight
        video.style.width = that.windowWidth + 'px'; // videoWidth

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = that.windowWidth;
        canvas.height = that.windowHeight;
        const ctx = canvas.getContext('2d');
        // Draw video on canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (_callback) {
          // Save screenshot to base64
          canvas.toBlob((blob) => {
            _callback(blob);
          });
        } else {
          console.log('Need callback!');
        }

        // Remove hidden video tag
        video.remove();
        try {
          // Destroy connect to stream
          stream.getTracks()[0].stop();
        } catch (e) {}
      };

      video.src = URL.createObjectURL(stream);
      document.body.appendChild(video);
    };

    const handleError = (e) => {
      console.log(e);
    };

    // Filter only screen type
    this._electronService.desktopCapturer.getSources({types: ['screen']}, (error, sources) => {
      if (error) {
        throw error;
      }
      // console.log(sources);
      for (let i = 0; i < sources.length; ++i) {
        // Filter: main screen
        if (sources[i].name === 'Entire screen') {
          const nav = <any>navigator;
          nav.getUserMedia  = nav.getUserMedia || nav.webkitGetUserMedia || nav.mozGetUserMedia || nav.msGetUserMedia;
          nav.getUserMedia({
            audio: false,
            video: {
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: sources[i].id,
                minWidth: 600,
                maxWidth: 4000,
                minHeight: 300,
                maxHeight: 4000
              }
            }
          }, handleStream, handleError);

          return;
        }
      }
    });
  }

  /**
   * add a note
   * @param note: note
   */
  addNote(note: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.activityId >= 0) {
        this._httpService.postCall(
          'trackly/note/activity_note',
          {
            activity_id: this.activityId,
            note: note
          }
        ).then(() => {
          console.log('Adding a note is successful!');
          resolve();
        }).catch((err) => {
          console.log('Add a note error', err);
          reject(err);
        });
      } else {
        reject();
      }
    });
  }

  /**
   * get setting data
   */
  getSetting(): Promise<any> {
    return new Promise((resolve, reject) => {
      this._httpService.getCall('trackly/gets/settings/widget_settings').then((res) => {
        console.log('setting data:', res);
        if (res && res['data']) {
          this.currentSetting = res['data'];
          resolve(res['data']);
        } else {
          this.currentSetting = {};
          reject();
        }
        this._electronService.ipcRenderer.send('update-setting', {
          setting: this.currentSetting
        });
      }).catch((error) => {
        console.log('Error to get project list', error);
        this.currentSetting = {};
        this._electronService.ipcRenderer.send('update-setting', {
          setting: this.currentSetting
        });
        reject(error);
      });
    });
  }

  /**
   * update the setting
   * @param setting: setting data
   */
  updateSetting(setting: Object): Promise<any> {
    return new Promise((resolve, reject) => {
      this._httpService.postCall('/trackly/settings/widget_settings', setting).then((res) => {
        console.log('Updating setting is successful!', res);
        this.getSetting().catch(() => console.log());
        resolve();
      }).catch((error) => {
        reject(error);
      });
    });
  }
}
