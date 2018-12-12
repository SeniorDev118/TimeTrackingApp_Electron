import {
  Component,
  OnInit,
  Inject
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material';
import * as moment from 'moment';

@Component({
  selector: 'app-setting-modal',
  templateUrl: './setting-modal.component.html',
  styleUrls: ['./setting-modal.component.scss']
})
export class SettingModalComponent implements OnInit {
  isLoad: boolean;
  isShowTimer: boolean;
  isNotifyScreenshot: boolean;
  isNotifyTrack: boolean;
  trackInterval: number;
  startTime: string;
  endTime: string;
  errorAlert: string; // error alert
  timeSchedules: string[];
  tracks: string[];

  constructor(
    public dialgoRef: MatDialogRef<SettingModalComponent>, @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isShowTimer = false;
    this.isLoad = false;
    this.isNotifyScreenshot = true;
    this.isNotifyTrack = true;
    this.errorAlert = '';
    this.timeSchedules = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday'
    ];
    this.trackInterval = 10;
    this.tracks = [];
    data['getDataPromise'].then((res) => {
      this.isShowTimer = res && res['show_timer'] ? res['show_timer'] : false;
      this.isNotifyScreenshot = res && res['notify_me_screenshot'] ? res['notify_me_screenshot'] : false;
      this.isNotifyTrack = res && res['notify_me_track_on'] ? res['notify_me_track_on'] : false;
      this.trackInterval = res && res['untracked_for_in_min'] ? res['untracked_for_in_min'] : 0;
      this.startTime = res && res['start_time'] ? moment((res['start_time']), 'HH:mm:ss').format('hh:mm a') : null;
      this.endTime = res && res['end_time'] ? moment((res['end_time']), 'HH:mm:ss').format('hh:mm a') : null;
      this.tracks = [];
      if (res && res['track_on']) {
        const trackOn = res['track_on'].trim();
        this.tracks = trackOn.split(',');
        if (this.tracks.length > 0) {
          for (let index = 0; index < this.tracks.length; index ++) {
            this.tracks[index] = this.capitalizeFirstLetter(this.tracks[index]);
          }
        }
      }
      this.isLoad = true;
    }).catch(() => {
      this.isLoad = true;
    });
  }

  ngOnInit() {
  }

  cancel() {
    this.dialgoRef.close({status: false});
  }

  /**
   * make first letter uppercase
   * @param str: string
   */
  capitalizeFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * save the setting
   */
  save() {
    if (this.tracks.length === 0) {
      this.errorAlert = 'Track day is required.';
      return;
    }

    if (!this.startTime) {
      this.errorAlert = 'Start time is required.';
      return;
    }

    if (!this.endTime) {
      this.errorAlert = 'End time is required.';
      return;
    }

    if (moment(this.startTime, 'hh:mm a') >= moment(this.endTime, 'hh:mm a')) {
      this.errorAlert = 'The start time should be smaller than the end one.';
      return;
    }

    const settingData = {
      show_timer: this.isShowTimer ? 1 : 0,
      notify_me_screenshot: this.isNotifyScreenshot ? 1 : 0,
      notify_me_track_on: this.isNotifyTrack ? 1 : 0,
      track_on: this.tracks.join(','),
      start_time: moment(this.startTime, 'hh:mm a').format('HH:mm:ss'),
      end_time: moment(this.endTime, 'hh:mm a').format('HH:mm:ss'),
      untracked_for_in_min: this.trackInterval ? this.trackInterval : 0
    };

    this.dialgoRef.close({
      status: true,
      data: settingData
    });
  }

}
