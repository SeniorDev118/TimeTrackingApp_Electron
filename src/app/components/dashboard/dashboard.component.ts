import { Component, OnInit, OnDestroy } from '@angular/core';
import { ElectronService } from 'ngx-electron';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  isLoad: boolean;

  projects: Object[];

  constructor(
    private _electronService: ElectronService
  ) {
    this.projects = [];
    this.isLoad = false;
  }

  ngOnInit() {
    if(this._electronService.isElectronApp) {
      this._electronService.ipcRenderer.send('projects-call', {
        token: localStorage.getItem('userToken')
      });
      this._electronService.ipcRenderer.on('projects-call-reply', (event, arg) => {
        console.log('projects: ', arg)
        if (arg['success']) {
          this.projects = arg['res'];
        }
        this.isLoad = true;
      });
    }
  }

  ngOnDestroy() {
    if (this._electronService.ipcRenderer) {
      this._electronService.ipcRenderer.removeAllListeners('projects-call-reply');
    }
  }

}
