import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'objectKey'
})
export class ObjectKeyPipe implements PipeTransform {

  /**
   * convert object keys to array
   * @param value: object
   * @param args
   */
  transform(value: any, args?: any): any {
    return Object.keys(value);
  }

}
