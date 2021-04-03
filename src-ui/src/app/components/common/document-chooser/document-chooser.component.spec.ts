import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentChooserComponent } from './document-chooser.component';

describe('DocumentChooserComponent', () => {
  let component: DocumentChooserComponent;
  let fixture: ComponentFixture<DocumentChooserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DocumentChooserComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentChooserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
