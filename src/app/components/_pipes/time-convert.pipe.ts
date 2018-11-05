import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeConvert'
})
export class TimeConvertPipe implements PipeTransform {

  /**
   * time format filter
   * @param value: value of date
   * @param args
   */
  transform(value: any, args?: any): any {
    if (value) {
      const hours =  Math.floor(Math.floor(value / 3600));
      const minutes = Math.floor(Math.floor((value - (hours * 3600)) / 60));
      const seconds = Math.floor((value - ((hours * 3600) + (minutes * 60))) % 60);

      const dHours = (hours > 9 ? hours : '0' + hours);
      const dMins = (minutes > 9 ? minutes : '0' + minutes);
      const dSecs = (seconds > 9 ? seconds : '0' + seconds);
      return dHours + ':' + dMins + ':' + dSecs;
    } else {
      return '00:00:00';
    }
  }

}
