import { Component, Input, Output, ElementRef, EventEmitter } from '@angular/core';
import { fromEvent } from 'rxjs';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-input-debounce',
  templateUrl: './input-debounce.component.html',
  styleUrls: ['./input-debounce.component.scss']
})
export class InputDebounceComponent {

  @Input()
  placeholder: string

  @Input()
  tooltip: string

  @Input()
  delay: number = 300

  @Input()
  classes: string

  @Output()
  value: EventEmitter<string> = new EventEmitter<string>()

  public inputValue: string;

  constructor(private elementRef: ElementRef) {
    fromEvent(elementRef.nativeElement, 'keyup').pipe(
      map(() => this.inputValue),
      debounceTime(this.delay),
      distinctUntilChanged()
    ).subscribe(input =>
      this.value.emit(input)
    );
  }

  get cssClasses(): string {
    return 'form-control ' + this.classes
  }

}
