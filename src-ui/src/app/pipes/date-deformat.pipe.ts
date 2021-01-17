import { getLocaleDateFormat, FormatWidth } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateDeformat'
})
export class DateDeformatPipe implements PipeTransform {
  transform(dateString: string, dateFormat: string): Date {
    let parts = dateFormat.split(/[\/.]+/)
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
