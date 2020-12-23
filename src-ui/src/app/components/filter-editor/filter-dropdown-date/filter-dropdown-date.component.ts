import { formatDate } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

export interface DateSelection {
  before?: string
  after?: string
}

const FILTER_LAST_7_DAYS = 0
const FILTER_LAST_MONTH = 1
const FILTER_LAST_3_MONTHS = 2
const FILTER_LAST_YEAR = 3

@Component({
  selector: 'app-filter-dropdown-date',
  templateUrl: './filter-dropdown-date.component.html',
  styleUrls: ['./filter-dropdown-date.component.scss']
})
export class FilterDropdownDateComponent implements OnInit, OnDestroy {

  quickFilters = [
    {id: FILTER_LAST_7_DAYS, name: "Last 7 days"},
    {id: FILTER_LAST_MONTH, name: "Last month"},
    {id: FILTER_LAST_3_MONTHS, name: "Last 3 months"},
    {id: FILTER_LAST_YEAR, name: "Last year"}
  ]

  @Input()
  dateBefore: string

  @Input()
  dateAfter: string

  @Input()
  title: string

  @Output()
  datesSet = new EventEmitter<DateSelection>()

  private datesSetDebounce$ = new Subject()
  private sub: Subscription

  dpDateBeforeValue: NgbDateStruct
  dpDateAfterValue: NgbDateStruct

  ngOnInit() {
    this.sub = this.datesSetDebounce$.pipe(
      debounceTime(400)
    ).subscribe(() => {
      this.onChange()
    })
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe()
    }
  }

  setDateQuickFilter(qf: number) {
    this.dateBefore = null
    let date = new Date()
    switch (qf) {
      case FILTER_LAST_7_DAYS:
        date.setDate(date.getDate() - 7)
        break;

      case FILTER_LAST_MONTH:
        date.setMonth(date.getMonth() - 1)
        break;

      case FILTER_LAST_3_MONTHS:
        date.setMonth(date.getMonth() - 3)
        break

      case FILTER_LAST_YEAR:
        date.setFullYear(date.getFullYear() - 1)
        break

      }
    this.dateAfter = formatDate(date, 'yyyy-MM-dd', "en-us", "UTC")
    this.onChange()
  }

  onChange() {
    this.dpDateBeforeValue = this.toNgbDate(this.dateBefore)
    this.dpDateAfterValue = this.toNgbDate(this.dateAfter)
    this.datesSet.emit({after: this.dateAfter, before: this.dateBefore})
  }

  onChangeDebounce() {
    if (this.dateAfter?.length < 6) this.dateAfter = null
    else if (this.dateAfter && this.dateAfter.indexOf('-') == -1) this.dateAfter = this.dateAfter.substring(0,4) + '-' + this.dateAfter.substring(4,6) + '-' + this.dateAfter.substring(6,8)

    if (this.dateBefore?.length < 6) this.dateBefore = null
    else if (this.dateBefore && this.dateBefore.indexOf('-') == -1) this.dateBefore = this.dateBefore.substring(0,4) + '-' + this.dateBefore.substring(4,6) + '-' + this.dateBefore.substring(6,8)
    // dont fire on invalid dates using isNaN
    if (isNaN(new Date(this.dateAfter) as any)) this.dateAfter = null
    if (isNaN(new Date(this.dateBefore) as any)) this.dateBefore = null
    this.datesSetDebounce$.next()
  }

  dpAfterDateSelect(dateAfter: NgbDateStruct) {
    this.dateAfter = formatDate(dateAfter.year + '-' + dateAfter.month + '-' + dateAfter.day, 'yyyy-MM-dd', "en-US")
    this.onChange()
  }

  dpBeforeDateSelect(dateBefore: NgbDateStruct) {
    this.dateBefore = formatDate(dateBefore.year + '-' + dateBefore.month + '-' + dateBefore.day, 'yyyy-MM-dd', "en-US")
    this.onChange()
  }

  clearBefore() {
    this.dateBefore = null
    this.onChange()
  }

  clearAfter() {
    this.dateAfter = null
    this.onChange()
  }

  toNgbDate(dateFormatted: string): NgbDateStruct {
    if (!dateFormatted) return null
    else {
      let date = new Date(dateFormatted)
      return {year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() + 1}
    }
  }

}
