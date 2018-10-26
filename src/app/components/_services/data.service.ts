import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { HttpService } from './http.service';
import { Subject, Observable } from 'rxjs';

@Injectable()
export class DataService {
  isTakingScreenShot: boolean;
  windowWidth: number;
  windowHeight: number;
  tasks: Object[];
  screenshotUrls: string[];
  currentProject: Object;
  currentPojectId: number;
  currentTaskId: number;

  private tasksSubject: Subject<any>;

  constructor(
    private _electronService: ElectronService,
    private _httpService: HttpService
  ) {
    this.screenshotUrls = [];
    this.tasks = [];
    this.windowWidth = 0;
    this.windowHeight = 0;
    this.currentPojectId = -1;
    this.currentTaskId = -1;
    this.currentProject = {};
    this.tasksSubject = new Subject();
    this.isTakingScreenShot = false;
  }

  setAcitivityListener() {
    if (this._electronService.isElectronApp) {
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

      this._electronService.ipcRenderer.send('get-window-size', 'ping');
      this._electronService.ipcRenderer.on('get-window-size-reply', (event, arg) => {
        // let standardWidth = 480;
        // this.windowWidth = standardWidth;
        // this.windowHeight = arg.height * standardWidth / arg.width;
        this.windowWidth = arg.width;
        this.windowHeight = arg.height;
      });

      this._electronService.ipcRenderer.send('create-new-activity', 'ping');
      this._electronService.ipcRenderer.on('create-new-activity-reply', (event, arg) => {
        this.postActivity(arg);
      });

      this._electronService.ipcRenderer.send('take-screenshot', 'ping');
      this._electronService.ipcRenderer.on('take-screenshot-reply', (event, arg) => {
        console.log('take-screenshot-reply: ');
        this.isTakingScreenShot = true;
        this.takecreenshot();
      });

      this._electronService.ipcRenderer.on('start-track-reply', (event, arg) => {
        console.log('start-track-reply:', arg);
        this.currentPojectId = arg['projectId'];
        this.currentTaskId = arg['taskId'];

        if (this.tasks.length > 0) {
          for (let index = 0; index < this.tasks.length; index ++) {
            if (this.tasks[index]['id'] === arg['taskId']) {
              this.tasks[index]['timerStatus'] = 'Active';
            }
          }
          this.setTasksSubscribe();
        }
      });

      this._electronService.ipcRenderer.on('stop-track-reply', (event, arg) => {
        this.currentPojectId = -1;
        this.currentTaskId = -1;
        if (this.tasks.length > 0) {
          for (let index = 0; index < this.tasks.length; index ++) {
            if (this.tasks[index]['id'] === arg['task_id']) {
              this.tasks[index]['timerStatus'] = 'InActive';
            }
          }
          this.setTasksSubscribe();

          this.takecreenshot().then(() => {
            this.postActivity(arg);
          });
        }
      });
    }
  }

  stopTrack() {
    if (this._electronService.isElectronApp) {
      this._electronService.ipcRenderer.send('stop-track', {
        taskId: this.currentTaskId,
        projectId: this.currentPojectId
      });
    }
  }

  setTasks(projectId: number) {
    this.tasks = [];
    this._httpService.getCall(
      `/trackly/gets/tasks?target_table=projects&table_join_column=project_id&target_table_join_column=id&where=project_id=${projectId}`
    ).then((res) => {
      console.log(res);
      if (res.data && res.data.length > 0) {
        this.tasks = res.data.map((item) => {
          item['timerStatus'] = 'InActive';
          if (this.currentPojectId === projectId && this.currentTaskId === item['id']) {
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

  getTasksSubscribe(): Observable<any> {
    return this.tasksSubject.asObservable();
  }

  setTasksSubscribe() {
    this.tasksSubject.next({tasks: this.tasks});
  }

  setProject(project: Object) {
    this.currentProject = project;
  }

  postActivity(activity: Object, nCount: number = 0) {
    activity['screenshot_url'] = this.screenshotUrls;
    console.log('new activity: ', activity);
    this._httpService.postCall(
      'trackly/create/activity',
      activity
    ).then(() => {
      console.log('Activity creation is successful!');
      this.clearData();
    }).catch((err) => {
      console.log('Activity creation error', err);
      if (nCount < 20) {
          nCount ++;
          setTimeout(() => {
            this.postActivity(activity, nCount);
          }, 5 * 60 * 1000);
      }
    });
  }

  setScreenshotUrl(url: string) {
    this.screenshotUrls.push(url);
    if (this.screenshotUrls.length > 3) {
      this.screenshotUrls.splice(0, 3);
    }
  }

  clearData() {
    this.screenshotUrls = [];
  }

  buildScreenshot(preUrl: string, url: string) {
    this.fullscreenScreenshot((blob) => {
      this._httpService.uploadFile(preUrl, blob, 'image/png').then((res) => {
        console.log('Uploading screenshot is successful!: ', url);
      }).catch((err) => {
        console.log(err);
      });
    });
  }

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
}
