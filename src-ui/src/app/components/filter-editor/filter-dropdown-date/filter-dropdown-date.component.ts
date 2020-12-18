import { Component, EventEmitter, Input, Output, ElementRef, ViewChild, SimpleChange } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbDropdown, NgbDate, NgbDateStruct, NgbDatepicker } from '@ng-bootstrap/ng-bootstrap';

export interface DateSelection {
  before?: NgbDateStruct
  after?: NgbDateStruct
}

@Component({
  selector: 'app-filter-dropdown-date',
  templateUrl: './filter-dropdown-date.component.html',
  styleUrls: ['./filter-dropdown-date.component.scss']
})
export class FilterDropdownDateComponent {

  @Input()
  dateBefore: NgbDateStruct

  @Input()
  dateAfter: NgbDateStruct

  @Input()
  title: string

  @Output()
  datesSet = new EventEmitter<DateSelection>()

  @ViewChild('filterDateDropdown') filterDateDropdown: NgbDropdown
  @ViewChild('beforeForm') beforeForm: NgForm
  @ViewChild('afterForm') afterForm: NgForm
  @ViewChild('beforeDatepicker') beforeDatepicker: NgbDatepicker
  @ViewChild('afterDatepicker') afterDatepicker: NgbDatepicker

  _dateBefore: NgbDateStruct
  _dateAfter: NgbDateStruct

  _afterHasFocus: boolean = false
  _beforeHasFocus: boolean = false

  get _maxDate(): NgbDate {
    let date = new Date()
    return NgbDate.from({year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate()})
  }

  isStringRange(range: any) {
    return typeof range == 'string'
  }

  ngOnChanges(changes: SimpleChange) {
    // this is a hacky workaround perhaps because of https://github.com/angular/angular/issues/11097
    let dateString: string = ''
    let dateAfterChange: SimpleChange
    let dateBeforeChange: SimpleChange
    if (changes) {
      dateAfterChange = changes['dateAfter']
      dateBeforeChange = changes['dateBefore']
    }

    if (this.beforeDatepicker && this.afterDatepicker) {
      let afterDatepickerElRef: ElementRef = this.afterDatepicker['_elRef']
      let beforeDatepickerElRef: ElementRef = this.beforeDatepicker['_elRef']

      if (dateAfterChange && dateAfterChange.currentValue) {
        if (this._afterHasFocus) return
        let dateAfterDate = dateAfterChange.currentValue as NgbDateStruct
        dateString = `${dateAfterDate.year}-${dateAfterDate.month.toString().padStart(2,'0')}-${dateAfterDate.day.toString().padStart(2,'0')}`
        afterDatepickerElRef.nativeElement.value = dateString
      } else if (dateBeforeChange && dateBeforeChange.currentValue) {
        if (this._beforeHasFocus) return
        let dateBeforeDate = dateBeforeChange.currentValue as NgbDateStruct
        dateString = `${dateBeforeDate.year}-${dateBeforeDate.month.toString().padStart(2,'0')}-${dateBeforeDate.day.toString().padStart(2,'0')}`
        beforeDatepickerElRef.nativeElement.value = dateString
      } else {
        afterDatepickerElRef.nativeElement.value = dateString
        this._dateAfter = null
        beforeDatepickerElRef.nativeElement.value = dateString
        this._dateBefore = null
      }
    }
  }

  setDateQuickFilter(range: any) {
    let date = new Date()
    let newDate: NgbDateStruct = { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() }
    switch (typeof range) {
      case 'number':
        date.setDate(date.getDate() - range)
        newDate.year = date.getFullYear()
        newDate.month = date.getMonth() + 1
        newDate.day = date.getDate()
        break

      case 'string':
        newDate.day = 1
        if (range == 'year') newDate.month = 1
        break

      default:
        break
    }
    this._dateAfter = newDate
    this._dateBefore = null
    this.datesSet.emit({after: newDate, before: null})
  }

  onBeforeSelected(date: NgbDateStruct) {
    this._dateBefore = date
    this.datesSet.emit({before: date})
  }

  onAfterSelected(date: NgbDateStruct) {
    this._dateAfter = date
    this.datesSet.emit({after: date})
  }

  clearBefore() {
    this._dateBefore = null
    this.datesSet.emit({before: null})
  }

  clearAfter() {
    this._dateAfter = null
    this.datesSet.emit({after: null})
  }

  keyupAfter(event: KeyboardEvent) {
    if (event.key == 'Enter' && this.afterForm.valid && typeof this._dateAfter !== 'string') {
      this.datesSet.emit({after: this._dateAfter})
    }
  }

  keyupBefore(event: KeyboardEvent) {
    if (event.key == 'Enter') {
      if (this.beforeForm.valid && typeof this._dateBefore !== 'string') {

        this.datesSet.emit({before: this._dateBefore})
      } else if (!this.beforeForm.valid) {
        this.beforeDatepicker
      }
    }
  }

  dropdownOpenChange(opened) {
    if (!opened) {
      let dateSelection: DateSelection = {}

      // clear date if invalid
      if (!this.afterForm.valid) this._dateAfter = this.dateAfter
      else dateSelection.after = this._dateAfter

      if (!this.beforeForm.valid) this._dateBefore = this.dateBefore
      else dateSelection.before = this._dateBefore

      // apply the date if it is valid
      if (this.afterForm.valid || this.beforeForm.valid) this.datesSet.emit(dateSelection)
    }
  }
}
