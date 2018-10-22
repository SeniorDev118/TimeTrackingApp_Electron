import { Injectable } from '@angular/core';
import * as axios from 'axios';
import { AppConfig } from '../../../environments/environment';

@Injectable()
export class HttpService {

  constructor() { }

  postCall(url: string, data: any = {}):Promise<any> {
    return new Promise((resolve, reject) => {
      axios.default.post(
        `${AppConfig.apiUrl}/${url}`,
        data
      ).then((res) => {
        if (res.status === 200) {
          return resolve(res);
        } else {
          reject();
        }
      }).catch((err) => {
        reject(err);
      });
    });
  }

  getCall(url: string):Promise<any> {
    return new Promise((resolve, reject) => {
      axios.default.get(
        `${AppConfig.apiUrl}/${url}`
      ).then((res) => {
        if (res.status === 200) {
          return resolve(res);
        } else {
          reject();
        }
      }).catch((err) => {
        reject(err);
      });
    });
  }

  uploadFile(url: string, blob: any, mime: string):Promise<any> {
    return new Promise((resolve, reject) => {
      axios.default.put(
        url,
        blob,
        {
          headers: {
            'Content-Type': mime
          }
        }
      )
        .then((res) => {
          if (res.status === 200) {
            return resolve(res);
          } else {
            reject();
          }
        }).catch((err) => {
          reject(err);
        });
    });
  }
}