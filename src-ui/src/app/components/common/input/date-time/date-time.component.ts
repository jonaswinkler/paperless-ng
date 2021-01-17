import { formatDate } from '@angular/common';
import { Component, forwardRef, Input, OnInit, LOCALE_ID, Inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { DatePlaceholderFormatPipe } from 'src/app/pipes/date-placeholder-format.pipe';
import { DateMaskFormatPipe } from 'src/app/pipes/date-mask-format.pipe';
import { DateDeformatPipe } from 'src/app/pipes/date-deformat.pipe';

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

  constructor(
    @Inject(LOCALE_ID) private locale: string,
    private datePlaceholderFormatPipe: DatePlaceholderFormatPipe,
    private dateMaskFormatPipe: DateMaskFormatPipe,
    private dateDeformatPipe: DateDeformatPipe
  ) {
    this.locale = locale
    this.placeholder = datePlaceholderFormatPipe.transform(this.locale)
    this.mask = dateMaskFormatPipe.transform(this.placeholder)
  }

  placeholder: string = 'yyyy-mm-dd'
  mask: string = '0000-M0-d0'

  onChange = (newValue: any) => {};

  onTouched = () => {};

  writeValue(newValue: any): void {
    this.dateValue = formatDate(newValue, this.placeholder, this.locale)
    this.timeValue = formatDate(newValue, 'HH:mm:ss', this.locale)

    this.updateDatePicker(this.dateDeformatPipe.transform(this.dateValue, this.placeholder))
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
    this.dateValue = formatDate(date.year + '-' + date.month + '-' + date.day, this.placeholder, this.locale)
    this.dateOrTimeChanged()
  }

  dateOrTimeChanged() {
    if (this.dateValue) {
      let date = this.dateDeformatPipe.transform(this.dateValue, this.placeholder)
      let dateTimeStr = formatDate(date, "yyyy-MM-dd", this.locale)
      if (this.timeValue) dateTimeStr += "T" + this.timeValue
      let dateTimeFormatted = formatDate(dateTimeStr, "yyyy-MM-ddTHH:mm:ssZZZZZ", this.locale, "UTC")
      this.updateDatePicker(date)
      this.onChange(dateTimeFormatted)
    }
  }

  updateDatePicker(date: Date) {
    this.dpDateValue = {year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate()}
  }

}
