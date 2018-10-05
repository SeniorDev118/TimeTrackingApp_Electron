import { Component, OnInit, Output } from '@angular/core';
import { EventEmitter } from 'electron';
import { AlertService } from '../_services/alert.service';
import { ElectronService } from 'ngx-electron';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  tasks: Object[];
  isCreate: boolean;
  newTaskName: string;
  windowWidth: number;
  windowHeight: number;


  constructor(
    private alertService: AlertService,
    private _electronService: ElectronService
  ) {
    this.tasks = [
      {
        id: 1,
        title: 'Angular 6',
        time: 500,
        status: 'stop'
      },
      {
        id: 2,
        title: 'React',
        time: 200,
        status: 'stop'
      },
      {
        id: 3,
        title: 'Node',
        time: 300,
        status: 'stop'
      }
    ];
    this.isCreate = false;
    this.windowWidth = 0;
    this.windowHeight = 0;

    if(this._electronService.isElectronApp) {
      this._electronService.ipcRenderer.send('get-window-size', 'ping');
      this._electronService.ipcRenderer.on('get-window-size-reply', (event, arg) => {
        this.windowWidth = arg.width;
        this.windowHeight = arg.height;
      });
      this._electronService.ipcRenderer.on('send-screenshot-reply', (event, arg) => {
        console.log(arg)
      });
    }
  }

  ngOnInit() {
  }

  onCreate() {
    this.isCreate = true;
  }

  onCreateTask() {
    if (!this.newTaskName) {
      this.alertService.error('Task name is required.');
      return;
    }

    this.tasks.push({
      id: Math.floor(Math.random() * 100),
      title: this.newTaskName,
      time: 0,
      status: 'stop'
    });
    this.alertService.success('Creating a task is successful!');
    this.newTaskName = '';
    this.isCreate = false;
  }

  onCancelTask() {
    this.isCreate = false;
  }

  onStartScreenshot(taskId: number) {
    console.log(taskId)
    
    if(this._electronService.isElectronApp) {
      this.fullscreenScreenshot((base64data) => {
        this._electronService.ipcRenderer.send('send-screenshot', base64data);
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
