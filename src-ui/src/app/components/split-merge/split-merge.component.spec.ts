import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SplitMergeComponent } from './split-merge.component';

describe('SplitMergeComponent', () => {
  let component: SplitMergeComponent;
  let fixture: ComponentFixture<SplitMergeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SplitMergeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SplitMergeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
