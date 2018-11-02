import { Component, OnInit, OnDestroy } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DataService } from '../_services/data.service';

@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss']
})
export class TaskComponent implements OnInit, OnDestroy {
  tasks: Object[];
  isLoad: boolean;
  projectName: string;
  windowWidth: number;
  windowHeight: number;
  selectedTaskId: number;
  projectId: number;
  activeRouteSub: Subscription;
  tasksRouteSub: Subscription;


  constructor(
    private _electronService: ElectronService,
    private activeRoute: ActivatedRoute,
    private _dataService: DataService,
    private _router: Router
  ) {
    this.tasks = [];
    this.isLoad = false;
    this.windowWidth = 0;
    this.windowHeight = 0;
    this.selectedTaskId = -1;
    this.projectName = '';
  }

  ngOnInit() {
    this.activeRouteSub = this.activeRoute.params.subscribe(params => {
      this.projectId = parseInt(params['id'], 10);
      this._dataService.setTasks(this.projectId);
      this.projectName = this._dataService.currentProject ? this._dataService.currentProject['name'] : '';
    });
    this.tasksRouteSub = this._dataService.getTasksSubscribe().subscribe(res => {
      this.tasks = res['tasks'];
      this.selectedTaskId = -1;
      console.log('tasks detail:', res, this.projectId);

      if (this.projectId >= 0) {
        if (res['selectedProjectId'] >= 0 && res['selectedTaskId'] >= 0 && this.projectId === res['selectedProjectId']) {
          this.selectedTaskId = res['selectedTaskId'];
        }
      }

      this.isLoad = true;
    });
  }

  ngOnDestroy() {
    if (this.activeRouteSub) {
      this.activeRouteSub.unsubscribe();
    }

    if (this.tasksRouteSub) {
      this.tasksRouteSub.unsubscribe();
    }
  }

  onStartScreenshot(taskId: number, event: any) {
    event.stopPropagation();

    this.selectedTaskId = taskId;
    if (this._electronService.isElectronApp) {
      this._electronService.ipcRenderer.send('start-track', {
        taskId: taskId,
        projectId: this.projectId
      });
    }
  }

  onStopScreenshot(taskId: number, event: any) {
    event.stopPropagation();

    this.selectedTaskId = -1;
    if (this._electronService.isElectronApp) {
      this._electronService.ipcRenderer.send('stop-track', {
        taskId: taskId,
        projectId: this.projectId
      });
    }
  }

  onSelectTask(taskId: number) {
    this.selectedTaskId = taskId;
    this._electronService.ipcRenderer.send('select-task', {
      taskId: taskId,
      projectId: this.projectId
    });
  }

}
