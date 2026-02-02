import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatNumber',
  standalone: true,
})
export class FormatNumberPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined || value === Infinity) {
      return '∞';
    }

    const num = Number(value.toFixed(2));

    if (num >= 1000000) {
      const val = num / 1000000;
      return (
        Number(val.toFixed(2))
          .toString()
          .replace(/\.?0+$/, '') + 'M'
      );
    }

    if (num >= 1000) {
      const val = num / 1000;
      return (
        Number(val.toFixed(2))
          .toString()
          .replace(/\.?0+$/, '') + 'k'
      );
    }

    return num.toString();
  }
}
