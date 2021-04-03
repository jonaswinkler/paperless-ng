import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputDebounceComponent } from './text.component';

describe('InputDebounceComponent', () => {
  let component: InputDebounceComponent;
  let fixture: ComponentFixture<InputDebounceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InputDebounceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InputDebounceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
