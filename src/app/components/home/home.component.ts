import { Component, OnInit, Output, OnDestroy } from '@angular/core';
import { EventEmitter } from 'electron';
import { AlertService } from '../_services/alert.service';
import { ElectronService } from 'ngx-electron';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  tasks: Object[];
  isCreate: boolean;
  newTaskName: string;
  windowWidth: number;
  windowHeight: number;


  constructor(
    private alertService: AlertService,
    private _electronService: ElectronService
  ) {
    this.tasks = [];
    this.isCreate = false;
    this.windowWidth = 0;
    this.windowHeight = 0;

    if(this._electronService.isElectronApp) {
      this._electronService.ipcRenderer.send('get-window-size', 'ping');
      this._electronService.ipcRenderer.send('get-fake-data', 'ping');
      this._electronService.ipcRenderer.send('take-screenshot', 'ping');
      this._electronService.ipcRenderer.send('update-fake-data-subscribe', 'ping');

      this._electronService.ipcRenderer.on('get-fake-data-reply', (event, arg) => {console.log('tasks in home: ', arg['data'])
        if (arg['status']) {
          this.tasks = arg['data'];
        }
      });

      this._electronService.ipcRenderer.on('create-fake-data-reply', (event, arg) => {
        if (arg['status']) {
          this.tasks = arg['data'];
          this.alertService.success('Creating a task is successful!');
        } else {
          this.alertService.error('Creating a task is failed.');
        }
      });

      this._electronService.ipcRenderer.on('get-window-size-reply', (event, arg) => {
        let standardWidth = 480;
        this.windowWidth = standardWidth;
        this.windowHeight = arg.height * standardWidth / arg.width;
      });

      this._electronService.ipcRenderer.on('build-screenshot-reply', (event, arg) => {
        console.log(arg)
      });

      this._electronService.ipcRenderer.on('start-screenshot-reply', (event, arg) => {
        console.log(arg);
      });

      this._electronService.ipcRenderer.on('update-fake-data-subscribe-reply', (event, arg) => {
        console.log('update fake data: ', arg);
        this.tasks = arg;
      });

      this._electronService.ipcRenderer.on('take-screenshot-reply', (event, arg) => {console.log('screenshot');
        this.buildScreenshot(arg);
      });
    }
  }

  ngOnInit() {
    // this.tasks = [
    //   {
    //     id: 1,
    //     title: 'Angular',
    //     time: 300,
    //     status: 'stop'
    //   },
    //   {
    //     id: 2,
    //     title: 'React',
    //     time: '200',
    //     status: 'stop'
    //   },
    //   {
    //     id: 3,
    //     title: 'Node',
    //     time: '200',
    //     status: 'stop'
    //   }
    // ];
  }

  ngOnDestroy() {
    this._electronService.ipcRenderer.removeAllListeners('get-fake-data-reply');
    this._electronService.ipcRenderer.removeAllListeners('create-fake-data-reply');
    this._electronService.ipcRenderer.removeAllListeners('get-window-size-reply');
    this._electronService.ipcRenderer.removeAllListeners('build-screenshot-reply');
    this._electronService.ipcRenderer.removeAllListeners('start-screenshot-reply');
    this._electronService.ipcRenderer.removeAllListeners('update-fake-data-subscribe-reply');
    this._electronService.ipcRenderer.removeAllListeners('take-screenshot-reply');
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
    if(this._electronService.isElectronApp) {
      this._electronService.ipcRenderer.send('stop-screenshot', {
        taskId: taskId,
        intervalSeconds: 1 * 60 // 10 mins
      });
    }
  }

  onStartScreenshot(taskId: number) {
    if(this._electronService.isElectronApp) {
      this._electronService.ipcRenderer.send('start-screenshot', {
        taskId: taskId
      });
    }
  }

  buildScreenshot(taskId: number) {
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
                minWidth: 1280,
                maxWidth: 4000,
                minHeight: 720,
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
