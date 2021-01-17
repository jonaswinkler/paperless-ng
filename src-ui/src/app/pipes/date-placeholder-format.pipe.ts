import { getLocaleDateFormat, FormatWidth } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'datePlaceholderFormat'
})
export class DatePlaceholderFormatPipe implements PipeTransform {
  transform(locale: string): string {
    let dateFormat = getLocaleDateFormat(locale, FormatWidth.Short)
    let placeholder = dateFormat
    let parts = dateFormat.split(/[\/.]+/)
    parts.forEach(p => {
      if (p == 'y') placeholder = placeholder.replace(p, 'yyyy')
      else if (p == 'M') placeholder = placeholder.replace(p, 'MM')
      else if (p == 'd') placeholder = placeholder.replace(p, 'dd')
    })
    return placeholder
  }
}
