import { Component, OnInit } from '@angular/core';
import { HttpService } from '../_services/http.service';
import { DataService } from '../_services/data.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  isLoad: boolean;

  projects: Object[];

  constructor(
    private _httpService: HttpService,
    private _dataService: DataService,
    private _router: Router
  ) {
    this.projects = []; // project list
    this.isLoad = false; // page load flag
  }

  ngOnInit() {
    /**
     * get project list
     */
    this._httpService.getCall('trackly/gets/projects').then((res) => {
      console.log('project list: ', res.data);
      this.projects = res.data;
      this.isLoad = true;
    }).catch((err) => {
      console.log('Error to get project list', err);
    });
  }

  /**
   * go to specific project page
   * @param project: project data
   */
  goToTaskPage(project: Object) {
    if (project && project['id']) {
      this._dataService.setProject(project);
      this._router.navigate(['/task/' + project['id']]);
    }
  }

}
