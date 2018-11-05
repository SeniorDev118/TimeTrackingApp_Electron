import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { AlertService } from '../../_services/alert.service';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss']
})

export class AlertComponent implements OnInit, OnDestroy {
  private subscription: Subscription; // alert service subscription
  message: any; // message

  constructor(private alertService: AlertService) { }

  ngOnInit() {
    /**
     * alert service subscription
     */
    this.subscription = this.alertService.getMessage().subscribe(message => {
      this.message = message;
    });
  }

  /**
   * destroy subscription
   */
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
