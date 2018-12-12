import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DataService } from '../_services/data.service';
import { ElectronService } from '../../providers/electron.service';

@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss']
})
export class TaskComponent implements OnInit, OnDestroy {
  tasks: Object[]; // task list
  isLoad: boolean; // page load flag
  projectName: string; // project name
  windowWidth: number; // window width
  windowHeight: number; // window height
  selectedTaskId: number; // task id selected
  projectId: number; // project id
  activeRouteSub: Subscription; // route subscription
  tasksSub: Subscription; // tasks subscription


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
    /**
     * route subscription listener
     */
    this.activeRouteSub = this.activeRoute.params.subscribe(params => {
      this.projectId = parseInt(params['id'], 10);
      this._dataService.setTasks(this.projectId);
      this.projectName = this._dataService.currentProject ? this._dataService.currentProject['name'] : '';
    });

    /**
     * tasks subscription listener
     */
    this.tasksSub = this._dataService.getTasksSubscribe().subscribe(res => {
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

  /**
   * destory subscriptions
   */
  ngOnDestroy() {
    if (this.activeRouteSub) {
      this.activeRouteSub.unsubscribe();
    }

    if (this.tasksSub) {
      this.tasksSub.unsubscribe();
    }
  }

  /**
   * start screenshot
   * @param taskId: task id
   * @param event: event
   */
  onStartScreenshot(taskId: number, event: any) {
    event.stopPropagation();

    this.selectedTaskId = taskId;
    if (this._electronService.isElectron) {
      this._electronService.ipcRenderer.send('start-track', {
        taskId: taskId,
        projectId: this.projectId
      });
    }
  }

  /**
   * stop screenshot
   * @param taskId: task id
   * @param event: event
   */
  onStopScreenshot(taskId: number, event: any) {
    event.stopPropagation();

    this.selectedTaskId = -1;
    if (this._electronService.isElectron) {
      this._electronService.ipcRenderer.send('stop-track', {
        taskId: taskId,
        projectId: this.projectId
      });
    }
  }

  /**
   * select task
   * @param taskId: task id
   */
  onSelectTask(taskId: number) {
    this.selectedTaskId = taskId;
    this._electronService.ipcRenderer.send('select-task', {
      taskId: taskId,
      projectId: this.projectId
    });
  }

}
