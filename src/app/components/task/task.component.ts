import { Component, OnInit, OnDestroy } from '@angular/core';
import { AlertService } from '../_services/alert.service';
import { ElectronService } from 'ngx-electron';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss']
})
export class TaskComponent implements OnInit, OnDestroy {
  tasks: Object[];
  isCreate: boolean;
  isLoadProject: boolean;
  isLoadTasks: boolean;
  newTaskName: string;
  projectName: string;
  windowWidth: number;
  windowHeight: number;
  selectedTaskId: number;
  projectId: number;
  activeRouteSub: Subscription;


  constructor(
    private alertService: AlertService,
    private _electronService: ElectronService,
    private activeRoute: ActivatedRoute
  ) {
    this.tasks = [];
    this.isLoadProject = false;
    this.isLoadTasks = false;
    this.windowWidth = 0;
    this.windowHeight = 0;
    this.selectedTaskId = -1;
    this.projectName = '';

    if(this._electronService.isElectronApp) {
      this._electronService.ipcRenderer.on('tasks-call-reply', (event, arg) => {
        console.log('tasks: ', arg);
        if (arg['success']) {
          this.tasks = arg['res'];
        }
        this.isLoadTasks = true;
      });
      this._electronService.ipcRenderer.on('project-call-reply', (event, arg) => {
        if (arg['success']) {
          this.projectName = arg['res'][0] ? arg['res'][0]['name'] : '';
        }
        this.isLoadProject = true;
      });
      this._electronService.ipcRenderer.send('get-window-size', 'ping');
      this._electronService.ipcRenderer.send('get-fake-data', 'ping');
      this._electronService.ipcRenderer.send('take-screenshot', 'ping');
      this._electronService.ipcRenderer.send('update-fakeData', 'ping');

      this._electronService.ipcRenderer.on('get-fake-data-reply', (event, arg) => {
        if (arg['status']) {
          // this.tasks = arg['data'];
        }
      });

      this._electronService.ipcRenderer.on('create-fake-data-reply', (event, arg) => {
        // if (arg['status']) {
        //   this.tasks = arg['data'];
        //   this.alertService.success('Creating a task is successful!');
        // } else {
        //   this.alertService.error('Creating a task is failed.');
        // }
      });

      this._electronService.ipcRenderer.on('get-window-size-reply', (event, arg) => {
        let standardWidth = 480;
        this.windowWidth = standardWidth;
        this.windowHeight = arg.height * standardWidth / arg.width;
      });

      this._electronService.ipcRenderer.on('build-screenshot-reply', (event, arg) => {
        console.log('build-screenshot:', arg);
      });

      this._electronService.ipcRenderer.on('start-screenshot-reply', (event, arg) => {
        console.log(arg);
      });

      this._electronService.ipcRenderer.on('update-fakeData-reply', (event, arg) => {
        // console.log('update fake data: ', arg);
        // this.tasks = arg;
      });

      this._electronService.ipcRenderer.on('take-screenshot-reply', (event, arg) => {
        this.takecreenshot(arg);
      });
    }
  }

  ngOnInit() {
    this.activeRouteSub = this.activeRoute.params.subscribe(params => {
      this.projectId = parseInt(params['id']);
      this._electronService.ipcRenderer.send('tasks-call', {
        token: localStorage.getItem('userToken'),
        projectId: this.projectId
      });
      this._electronService.ipcRenderer.send('project-call', {
        token: localStorage.getItem('userToken'),
        projectId: this.projectId
      });
    });
  }

  ngOnDestroy() {
    if (this._electronService.ipcRenderer) {
      this._electronService.ipcRenderer.removeAllListeners('get-fake-data-reply');
      this._electronService.ipcRenderer.removeAllListeners('create-fake-data-reply');
      this._electronService.ipcRenderer.removeAllListeners('get-window-size-reply');
      this._electronService.ipcRenderer.removeAllListeners('build-screenshot-reply');
      this._electronService.ipcRenderer.removeAllListeners('start-screenshot-reply');
      this._electronService.ipcRenderer.removeAllListeners('update-fakeData-reply');
      this._electronService.ipcRenderer.removeAllListeners('take-screenshot-reply');
    }

    if (this.activeRouteSub) {
      this.activeRouteSub.unsubscribe();
    }
  }

  onCreate() {
    this.isCreate = true;
  }

  onCreateTask() {
    if (!this.newTaskName) {
      this.alertService.error('Task name is required.');
      return;
    }
    
    this._electronService.ipcRenderer.send('create-fake-data', {
      id: Math.floor(Math.random() * 100),
      title: this.newTaskName,
      time: 0,
      status: 'stop'
    });
    this.newTaskName = '';
    this.isCreate = false;
  }

  onCancelTask() {
    this.isCreate = false;
  }

  onStopScreenshot(taskId: number) {
    this.selectedTaskId = taskId;
    if(this._electronService.isElectronApp) {
      this._electronService.ipcRenderer.send('stop-screenshot', {
        taskId: taskId
      });
    }
  }

  onStartScreenshot(taskId: number) {
    this.selectedTaskId = taskId;
    if(this._electronService.isElectronApp) {
      this._electronService.ipcRenderer.send('start-screenshot', taskId);
    }
  }

  onSelectTask(taskId: number) {
    this.selectedTaskId = taskId;
    this._electronService.ipcRenderer.send('select-task', taskId);
    this._electronService.ipcRenderer.once('select-task-reply', (event, arg) => {
      this.alertService.success('The task is selected for tracking.');
    });
  }

  takecreenshot(taskId: number) {
    if(this._electronService.isElectronApp) {
      this.fullscreenScreenshot((base64data) => {
        this._electronService.ipcRenderer.send('build-screenshot', {
          data: base64data,
          taskId: taskId
        });
      },'image/png');
    }
  }

  fullscreenScreenshot(callback: Function, imageFormat: string) {
    let that = this;
    let _callback = callback;
    imageFormat = imageFormat || 'image/png';
    
    let handleStream = (stream) => {
      // Create hidden video tag
      let video = document.createElement('video');
      video.style.cssText = 'position:absolute;top:-10000px;left:-10000px;';
      // Event connected to stream
      video.onloadedmetadata = function () {
        // Set video ORIGINAL height (screenshot)
        video.style.height = that.windowHeight + 'px'; // videoHeight
        video.style.width = that.windowWidth + 'px'; // videoWidth

        // Create canvas
        let canvas = document.createElement('canvas');
        canvas.width = that.windowWidth;
        canvas.height = that.windowHeight;
        let ctx = canvas.getContext('2d');
        // Draw video on canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (_callback) {
          // Save screenshot to base64
          _callback(canvas.toDataURL(imageFormat));
        } else {
          console.log('Need callback!');
        }

        // Remove hidden video tag
        video.remove();
        try {
          // Destroy connect to stream
          stream.getTracks()[0].stop();
        } catch (e) {}
      }
      video.src = URL.createObjectURL(stream);
      document.body.appendChild(video);
    };

    let handleError = (e) => {
      console.log(e);
    };

    // Filter only screen type
    this._electronService.desktopCapturer.getSources({types: ['screen']}, (error, sources) => {
      if (error) throw error;
      // console.log(sources);
      for (let i = 0; i < sources.length; ++i) {
        // Filter: main screen
        if (sources[i].name === "Entire screen") {
          var nav = <any>navigator;
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
