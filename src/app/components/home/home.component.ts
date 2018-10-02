import { Component, OnInit, Output } from '@angular/core';
import { EventEmitter } from 'electron';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  items = ["Angular 6", "React", "Underscore"];
  newItem = "";
  pushItem = function() {
    if (this.newItem != "") {
      this.items.push(this.newItem);
      this.newItem = "";
    }
  }

  removeItem = function(index) {
    this.items.splice(index, 1);
  }

}
