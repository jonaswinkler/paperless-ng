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
  delay: number = 500

  @Input()
  classes: string

  @Input()
  allowClear: boolean = true

  @Input()
  set pattern(regexStr: string) {
    this._pattern = new RegExp(regexStr)
  }

  _pattern: RegExp

  @Output()
  value: EventEmitter<string> = new EventEmitter<string>()

  @Input()
  inputValue: string;

  constructor(private elementRef: ElementRef) {
    fromEvent(elementRef.nativeElement, 'keyup').pipe(
      map(() => this.inputValue),
      debounceTime(this.delay),
      distinctUntilChanged()
    ).subscribe(input =>
      this.value.emit(input)
    );
  }

  keyUp(event: any) {
    if (!this._pattern) return
    if (event.key.length == 1 && !this._pattern.test(event.key)) { // e.g. dont do for backspace
      // invalid character, prevent input
      event.preventDefault()
      event.stopImmediatePropagation()
      this.inputValue = this.inputValue.slice(this.inputValue.length, 1)
    }
  }

  get cssClasses(): string {
    return 'form-control ' + this.classes
  }

  clear() {
    this.inputValue = ''
    this.value.emit(this.inputValue)
  }

}
