import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-task-detail',
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.scss']
})
export class TaskDetailComponent implements OnInit {
  data: object[];
  items: object[];

  constructor() {
    this.data = [
      { time: '2018-7-26:02:30', mouseCount: 12, keyboardCount: 34 },
      { time: '2018-7-26:02:40', mouseCount: 23, keyboardCount: 65 },
      { time: '2018-7-26:02:50', mouseCount: 43, keyboardCount: 43 },
      { time: '2018-7-26:03:00', mouseCount: 23, keyboardCount: 2 },
      { time: '2018-7-26:03:10', mouseCount: 154, keyboardCount: 217 },
      { time: '2018-7-26:03:20', mouseCount: 21, keyboardCount: 87 },
      { time: '2018-7-26:03:30', mouseCount: 156, keyboardCount: 65 },
      { time: '2018-7-26:03:40', mouseCount: 25, keyboardCount: 43 }
    ];
    this.items = '1234567890123456'.split('').map((x, i) => {
      const num = i;
      // const num = Math.floor(Math.random() * 1000);
      return {
        url: `https://picsum.photos/600/400/?${num}`,
        title: `${num}`
      };
    });
  }

  ngOnInit() {
  }
}
