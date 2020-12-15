import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobFilesComponent } from './job-files.component';

describe('JobFilesComponent', () => {
  let component: JobFilesComponent;
  let fixture: ComponentFixture<JobFilesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ JobFilesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(JobFilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
