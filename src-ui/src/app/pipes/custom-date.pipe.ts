import { DatePipe, getLocaleDateFormat, FormatWidth } from '@angular/common';
import { Inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';
import { SettingsService, SETTINGS_KEYS } from '../services/settings.service';

@Pipe({
  name: 'customDate'
})
export class CustomDatePipe extends DatePipe implements PipeTransform {
  private _locale

  constructor(@Inject(LOCALE_ID) locale: string, private settings: SettingsService) {
    super(settings.get(SETTINGS_KEYS.DATE_LOCALE) || locale)
    this._locale = locale
  }

  transform(value: any, format?: string, timezone?: string, locale?: string): string | null {
    return super.transform(value, format || this.settings.get(SETTINGS_KEYS.DATE_FORMAT), timezone, locale)
  }

  get mask(): string {
    // https://github.com/angular/angular/blob/a7964f4eca809d0cfd0e6712f4eb6126ca8b563d/packages/common/locales/closure-locale.ts#L2181
    let mask = this.placeholder
    let parts = mask.split(/[\/\.]+/)
    parts.forEach(p => {
      if (p == 'y' || p == 'yyyy') mask = mask.replace(p, '0000')
      else if (p == 'yy') mask = mask.replace(p, '00')
      else if (p == 'MM' || p == 'M') mask = mask.replace(p, 'M0')
      else if (p == 'dd' || p == 'd') mask = mask.replace(p, 'd0')
    })
    return mask
  }

  get placeholder(): string {
    const dateFormat = getLocaleDateFormat(this.settings.get(SETTINGS_KEYS.DATE_LOCALE) || this.settings.getLanguage() || this._locale, FormatWidth.Short)
    let placeholder = dateFormat
    const parts = dateFormat.split(/[\/\.]+/)
    parts.forEach(p => {
      if (p == 'y') placeholder = placeholder.replace(p, 'yyyy')
      else if (p == 'M') placeholder = placeholder.replace(p, 'MM')
      else if (p == 'd') placeholder = placeholder.replace(p, 'dd')
    })
    return placeholder
  }

  transformLocalizedString(dateString: string): Date {
    const dateFormat = this.placeholder
    const parts = dateFormat.split(/[\/\.]+/)
    let date = new Date()
    parts.forEach(p => {
      if (p.indexOf('y') !== -1) {
        let year = dateString.substring(dateFormat.indexOf(p), dateFormat.indexOf(p) + p.length)
        if (p.length == 2) year = '20' + year
        date.setFullYear(Number(year))
      } else if (p.indexOf('M') !== -1) {
        let month = dateString.substring(dateFormat.indexOf(p), dateFormat.indexOf(p) + p.length)
        date.setMonth(Number(month) - 1)
      } else if (p.indexOf('d') !== -1) {
        let day = dateString.substring(dateFormat.indexOf(p), dateFormat.indexOf(p) + p.length)
        date.setDate(Number(day))
      }
    })
    return date
  }
}
