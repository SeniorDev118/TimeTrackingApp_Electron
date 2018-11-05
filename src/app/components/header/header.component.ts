import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { DataService } from '../_services/data.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  isLogin: boolean; // user login flag
  sub: Subscription; // router navigation subscription

  constructor(
    private router: Router,
    private _dataService: DataService
  ) {
  }

  ngOnInit() {
    /** router navigation subscribe */
    this.sub = this.router.events.subscribe((s) => {
      if (s instanceof NavigationEnd) {
        this.initData();
      }
    });
  }

  ngOnDestroy() {
    // destroy subscriptions
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  /**
   * init data
   */
  initData() {
    if (localStorage.getItem('userToken')) {
      this.isLogin = true;
    } else {
      this.isLogin = false;
    }
  }

  /**
   * logout
   */
  logout() {
    localStorage.removeItem('userToken');
    this._dataService.stopTrack();
    this.router.navigate(['/login']);
  }

}
