import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  isLogin: boolean;
  sub: Subscription;

  constructor(
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
    if (localStorage.getItem('userToken')) {
      this.isLogin = true;
    } else {
      this.isLogin = false;
    }
  }

  logout() {
    localStorage.removeItem('userToken');
    this.router.navigate(['/login']);
  }

}
