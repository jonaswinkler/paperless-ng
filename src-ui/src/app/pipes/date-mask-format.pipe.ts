import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateMaskFormat'
})
export class DateMaskFormatPipe implements PipeTransform {
  transform(dateFormat: string): string {
    // https://github.com/angular/angular/blob/a7964f4eca809d0cfd0e6712f4eb6126ca8b563d/packages/common/locales/closure-locale.ts#L2181
    let mask = dateFormat
    let parts = dateFormat.split(/[\/.]+/)
    parts.forEach(p => {
      if (p == 'y' || p == 'yyyy') mask = mask.replace(p, '0000')
      else if (p == 'yy') mask = mask.replace(p, '00')
      else if (p == 'MM' || p == 'M') mask = mask.replace(p, 'M0')
      else if (p == 'dd' || p == 'd') mask = mask.replace(p, 'd0')
    })
    return mask
   }
}
