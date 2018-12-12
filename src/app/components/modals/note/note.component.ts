import {
  Component,
  OnInit,
  Inject
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material';

@Component({
  selector: 'app-note',
  templateUrl: './note.component.html',
  styleUrls: ['./note.component.scss']
})
export class NoteComponent implements OnInit {
  title: string;
  error: string;
  note: string;

  constructor(
    public dialgoRef: MatDialogRef<NoteComponent>, @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.title = 'Add Work Notes';
    this.error = '';
  }

  ngOnInit() {
  }

  cancel() {
    this.dialgoRef.close({status: false});
  }

  addNote() {
    if (!this.note) {
      this.error = 'Empty note';
      return;
    }
    this.dialgoRef.close({
      status: true,
      note: this.note
    });
  }

}
