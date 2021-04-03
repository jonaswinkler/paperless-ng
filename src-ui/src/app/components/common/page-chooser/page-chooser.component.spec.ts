import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageChooserComponent } from './page-chooser.component';

describe('PageChooserComponent', () => {
  let component: PageChooserComponent;
  let fixture: ComponentFixture<PageChooserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PageChooserComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PageChooserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
