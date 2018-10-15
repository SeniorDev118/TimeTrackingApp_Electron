import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskComponent } from './task.component';
import { TranslateModule } from '@ngx-translate/core';

describe('TaskComponent', () => {
  let component: TaskComponent;
  let fixture: ComponentFixture<TaskComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TaskComponent ],
      imports: [
        TranslateModule.forRoot()
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render title in a h1 tag', async(() => {
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('h1').textContent).toContain('PAGES.TASK.TITLE');
  }));
});
