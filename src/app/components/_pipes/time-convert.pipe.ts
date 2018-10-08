import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeConvert'
})
export class TimeConvertPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (value) {
      let hours =  Math.floor(Math.floor(value / 3600)); 
      let minutes = Math.floor(Math.floor((value - (hours * 3600)) / 60)); 
      let seconds= Math.floor((value - ((hours * 3600) + (minutes * 60))) % 60);

      let dHours = (hours > 9 ? hours : '0' + hours);
      let dMins = (minutes > 9 ? minutes : '0' + minutes);
      let dSecs = (seconds > 9 ? seconds : '0' + seconds);
      return dHours + ":" + dMins + ":" + dSecs;
    } else {
      return '00:00:00';
    }
  }

}
