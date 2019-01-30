import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService } from '../_services/data.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  selectedProjectId: number; // projected id selected
  selectedTaskId: number; // task id selected
  projectCode: string; // project code
  engagement: string; // engagement
  projects: Object; // projects
  isTracking: boolean; // track status flag
  isActivity: boolean; // activity flag
  isGetProjects: boolean; // status to get projects
  engagementSub: Subscription; // engagement subscription
  projecttSub: Subscription; // project subscription
  trackStatusSub: Subscription; // track status subscription
  signOutSub: Subscription; // sign out subscription
  objectKeys = Object.keys;

  constructor(
    private _dataService: DataService,
    private _router: Router
  ) {
    this.engagement = '';
    this.initData();
  }

  ngOnInit() {
    this.trackStatusSub = this._dataService.getTrackStatusSubscribe().subscribe(res => {console.log('status: ', res)
      if (res['type'] === 'status') {
        this.isTracking = res['value'];
      } else if (res['type'] === 'activity') {
        this.isActivity = res['value'];
      }
    });

    this.engagementSub = this._dataService.getEnagementSubscribe().subscribe(res => {
      this.engagement = res;
    });

    this.projecttSub = this._dataService.getProjectCodeSubscribe().subscribe(res => {
      this.projectCode = res;
    });

    this.signOutSub = this._dataService.getSignOutSubscribe().subscribe(() => {
      this.initData();
    });
  }

  ngOnDestroy() {
    if (this.engagementSub) {
      this.engagementSub.unsubscribe();
    }

    if (this.projecttSub) {
      this.projecttSub.unsubscribe();
    }

    if (this.trackStatusSub) {
      this.trackStatusSub.unsubscribe();
    }

    if (this.signOutSub) {
      this.signOutSub.unsubscribe();
    }
  }

  /**
   * initialize the data
   */
  initData() {
    this.selectedProjectId = -1;
    this.selectedTaskId = -1;
    this.projectCode = '';
    this.isTracking = false;
    this.isGetProjects = false;
    this.isActivity = false;
    this.projects = {};
  }

  /**
   * get all projects and tasks
   */
  getProjectTasks() {
    this._dataService.getAllProjectsTaks().then((res) => {
      this.projects = {};
      if (res[0] && res[0].length > 0) { // projects
        for (let index = 0; index < res[0].length; index ++) {
          const item = res[0][index];
          this.projects[item['id']] = item;
          this.projects[item['id']]['tasks'] = [];
        }
      }

      if (res[1] && res[1].length > 0) { // tasks
        for (let index = 0; index < res[1].length; index ++) {
          const item = res[1][index];
          if (this.projects.hasOwnProperty(item['project_id'])) {
            this.projects[item['project_id']]['tasks'].push({
              id: item['id'],
              name: item['name']
            });
          }
        }
      }
      this.isGetProjects = true;
      console.log('Project List: ', this.projects);
    }).catch(() => {
      this.isGetProjects = true;
    });
  }

  /**
   * click project
   * @param projectId project id
   */
  onClickProject(projectId: number) {
    this.selectedProjectId = Math.floor(projectId);
    if (this.projects[projectId]) {
      this._dataService.setProject(this.projects[projectId]);
    }
  }

  /**
   * click task
   * @param projectId project id
   * @param taskId task id
   */
  onClickTask(projectId: number, taskId: number) {
    this.selectedProjectId = Math.floor(projectId);
    this.selectedTaskId = Math.floor(taskId);
    if (this.projects[projectId]) {
      this._dataService.setProject(this.projects[projectId]);
    }
  }

  /**
   * start tracking
   */
  onStart() {
    this._dataService.handleTrack('start', this.selectedProjectId, this.selectedTaskId);
  }

  /**
   * stop tracking
   */
  onStop() {
    this._dataService.handleTrack('stop', this.selectedProjectId, this.selectedTaskId);
  }

  /**
   * add a note
   */
  onAddANote() {
    this._dataService.addANote();
  }

  /**
   * open dashboard
   */
  onOpenDashboard() {
    this._dataService.openDashboard();
  }

  /**
   * setting
   */
  onSetting() {
    this._dataService.settting();
  }

  /**
   * about trackl.y
   */
  onAbout() {
    this._dataService.aboutTrackly();
  }

  /**
   * help
   */
  onHelp() {
    this._router.navigate(['/help']);
  }

  /**
   * check for update
   */
  onCheckUpdate() {
    this._router.navigate(['/check']);
  }

  /**
   * open menu
   */
  onOpenMenu() {
    if (localStorage.getItem('userInformation')) {
      this.getProjectTasks();
    }
  }

  /**
   * sign out
   */
  onSignOut() {
    this._dataService.signOut();
  }

  /**
   * quit app
   */
  onQuit() {
    this.initData();
    this._dataService.quitApp();
  }

}
