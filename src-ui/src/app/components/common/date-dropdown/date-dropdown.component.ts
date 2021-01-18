import { formatDate, getLocaleDateFormat, FormatWidth } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, LOCALE_ID, Inject } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { CustomDatePipe } from 'src/app/pipes/custom-date.pipe';

export interface DateSelection {
  before?: string
  after?: string
}

const LAST_7_DAYS = 0
const LAST_MONTH = 1
const LAST_3_MONTHS = 2
const LAST_YEAR = 3

@Component({
  selector: 'app-date-dropdown',
  templateUrl: './date-dropdown.component.html',
  styleUrls: ['./date-dropdown.component.scss']
})
export class DateDropdownComponent implements OnInit, OnDestroy {

  quickFilters = [
    {id: LAST_7_DAYS, name: $localize`Last 7 days`},
    {id: LAST_MONTH, name: $localize`Last month`},
    {id: LAST_3_MONTHS, name: $localize`Last 3 months`},
    {id: LAST_YEAR, name: $localize`Last year`}
  ]

  placeholder: string = 'yyyy-mm-dd'
  mask: string = '0000-M0-d0'

  @Input()
  dateBefore: string

  @Output()
  dateBeforeChange = new EventEmitter<string>()

  @Input()
  dateAfter: string

  @Output()
  dateAfterChange = new EventEmitter<string>()

  @Input()
  title: string

  @Output()
  datesSet = new EventEmitter<DateSelection>()

  private datesSetDebounce$ = new Subject()
  private sub: Subscription

  dpDateBeforeValue: NgbDateStruct
  dpDateAfterValue: NgbDateStruct

  constructor(
    @Inject(LOCALE_ID) private locale: string,
    private datePipe: CustomDatePipe
  ) {
    this.placeholder = datePipe.placeholder
    this.mask = datePipe.mask
  }

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
      case LAST_7_DAYS:
        date.setDate(date.getDate() - 7)
        break;

      case LAST_MONTH:
        date.setMonth(date.getMonth() - 1)
        break;

      case LAST_3_MONTHS:
        date.setMonth(date.getMonth() - 3)
        break

      case LAST_YEAR:
        date.setFullYear(date.getFullYear() - 1)
        break

      }
    this.dateAfter = formatDate(date, 'shortDate', this.locale, "UTC")
    this.onChange()
  }

  onChange() {
    this.dateAfterChange.emit(this.dateAfter)
    this.dateBeforeChange.emit(this.dateBefore)
    this.dpDateBeforeValue = this.dateBefore ? this.toNgbDate(this.datePipe.transformLocalizedString(this.dateBefore)) : null
    this.dpDateAfterValue = this.dateAfter ? this.toNgbDate(this.datePipe.transformLocalizedString(this.dateAfter)) : null

    this.datesSet.emit({
      after: this.dateAfter ? formatDate(this.datePipe.transformLocalizedString(this.dateAfter), 'yyyy-MM-dd', this.locale) : null,
      before: this.dateBefore ? formatDate(this.datePipe.transformLocalizedString(this.dateBefore), 'yyyy-MM-dd', this.locale) : null
    })
  }

  onChangeDebounce() {
    if (this.dateAfter?.length < (this.mask.length - 2)) this.dateAfter = null
    if (this.dateBefore?.length < (this.mask.length - 2)) this.dateBefore = null
    // dont fire on invalid dates using isNaN
    if (this.dateAfter && isNaN(this.datePipe.transformLocalizedString(this.dateAfter) as any)) this.dateAfter = null
    if (this.dateBefore && isNaN(this.datePipe.transformLocalizedString(this.dateBefore) as any)) this.dateBefore = null
    this.datesSetDebounce$.next()
  }

  dpAfterDateSelect(dateAfter: NgbDateStruct) {
    this.dateAfter = formatDate(dateAfter.year + '-' + dateAfter.month + '-' + dateAfter.day, 'shortDate', this.locale)
    this.onChange()
  }

  dpBeforeDateSelect(dateBefore: NgbDateStruct) {
    this.dateBefore = formatDate(dateBefore.year + '-' + dateBefore.month + '-' + dateBefore.day, 'shortDate', this.locale)
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

  toNgbDate(date: Date): NgbDateStruct {
    if (!date) return null
    else {
      return {year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate()}
    }
  }

}
