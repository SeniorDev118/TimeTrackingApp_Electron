import { Component, OnInit, OnDestroy } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-task-detail',
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.scss']
})
export class TaskDetailComponent implements OnInit, OnDestroy {
  timeLogs: Object[];
  screens: Object[];
  task: Object;

  constructor(
    private _electronService: ElectronService,
    private activatedRoute: ActivatedRoute
  ) {
    this.task = {};
    this.timeLogs = [];
    this.screens = [];
  }

  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      let taskId = parseInt(params['id']);
      if(this._electronService.isElectronApp) {
        this._electronService.ipcRenderer.send('get-fake-data', 'ping');
        this._electronService.ipcRenderer.on('get-fake-data-reply', (event, arg) => {
          if (arg['status']) {
            if (arg['data']) {
              for (let index = 0; index < arg['data'].length; index ++) {
                if (arg['data'][index]['id'] === taskId) {
                  this.task = arg['data'][index];
                }
              }
              this.initData();
            }
          }
        });
      }
    });
  }

  ngOnDestroy() {
    this._electronService.ipcRenderer.removeAllListeners('get-fake-data-reply');
  }

  formatDate(data: string) {
    if (data.length === 1) {
      data = '0' + data;
    }
    return data;
  }

  convertToDate(timestamp: number) {
    const date = new Date(timestamp);
    let day = date.getDate() + '';
    let month = (date.getMonth() + 1) + '';
    let year = date.getFullYear() + '';
    let hour = date.getHours() + '';
    let minutes = date.getMinutes() + '';
    let seconds = date.getSeconds() + '';

    if (isNaN(parseInt(day, 10)) || isNaN(parseInt(month, 10)) || isNaN(parseInt(year, 10)) ||
      isNaN(parseInt(seconds, 10)) || isNaN(parseInt(minutes, 10)) || isNaN(parseInt(hour, 10))) {
      return 'N/A';
    } else {
      day     = this.formatDate(day);
      month   = this.formatDate(month);
      year    = this.formatDate(year);
      hour    = this.formatDate(hour);
      minutes = this.formatDate(minutes);
      seconds = this.formatDate(seconds);

      return `${year}-${month}-${day} ${hour}:${minutes}:${seconds}`;
    }
  }

  initData() {
    this.timeLogs = [];
    this.screens = [];
    if (this.task.hasOwnProperty('timeLogs')) {
      for (const key in this.task['timeLogs']) {
        if (this.task['timeLogs'].hasOwnProperty(key)) {
          this.timeLogs.push({
            time: this.convertToDate(parseInt(key)),
            mouseCount: this.task['timeLogs'][key]['mouseCount'],
            keyboardCount: this.task['timeLogs'][key]['keyboardCount']
          });
        }
      }
      this.timeLogs.sort((a, b) => {
        return parseFloat(b['timestamp']) - parseFloat(a['timestamp']);
      });
    }

    if (this.task.hasOwnProperty('screens')) {
      this.screens = this.task['screens'].map((item) => {
        return {
          url: '../' + item['imagePath'],
          title: this.convertToDate(parseInt(item['timestamp']))
        };
      });
    }
    console.log('screens: ', this.screens )
  }
}
