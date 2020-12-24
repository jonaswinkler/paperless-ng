import { formatDate } from '@angular/common';
import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

@Component({
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DateTimeComponent),
    multi: true
  }],
  selector: 'app-input-date-time',
  templateUrl: './date-time.component.html',
  styleUrls: ['./date-time.component.scss']
})
export class DateTimeComponent implements OnInit,ControlValueAccessor  {

  constructor() {
  }

  onChange = (newValue: any) => {};

  onTouched = () => {};

  writeValue(newValue: any): void {
    this.dateValue = formatDate(newValue, 'yyyy-MM-dd', "en-US")
    this.timeValue = formatDate(newValue, 'HH:mm:ss', 'en-US')
    this.updateDatePicker(this.dateValue)
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  @Input()
  titleDate: string = "Date"

  @Input()
  titleTime: string

  @Input()
  disabled: boolean = false

  @Input()
  hint: string

  timeValue: string

  dateValue: string

  dpDateValue: NgbDateStruct

  ngOnInit(): void {
  }

  dpDateSelect(date: NgbDateStruct) {
    this.dateValue = formatDate(date.year + '-' + date.month + '-' + date.day, 'yyyy-MM-dd', "en-US")
    this.dateOrTimeChanged()
  }

  dateOrTimeChanged() {
    if (this.dateValue) {
      let dateTimeStr = this.dateValue
      if (this.timeValue) dateTimeStr += "T" + this.timeValue
      let dateTimeFormatted = formatDate(dateTimeStr, "yyyy-MM-ddTHH:mm:ssZZZZZ", "en-us", "UTC")
      this.updateDatePicker(dateTimeFormatted)
      this.onChange(dateTimeFormatted)
    }
  }

  updateDatePicker(dateTimeFormatted: string) {
    let date = new Date(dateTimeFormatted)
    this.dpDateValue = {year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate()}
  }

}
