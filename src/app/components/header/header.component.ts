import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthenticationService } from '../_services/authentication.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  isLogin: boolean;
  sub: Subscription;

  constructor(
    private authenticationService: AuthenticationService,
    private router: Router
  ) {
  }

  ngOnInit() {
    this.sub = this.router.events.subscribe((s) => {
      if (s instanceof NavigationEnd) {
        this.initData();
      }
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  initData() {
    if (localStorage.getItem('currentUser')) {
      this.isLogin = true;
    } else {
      this.isLogin = false;
    }
  }

  logout() {
    this.authenticationService.logout();
  }

}
