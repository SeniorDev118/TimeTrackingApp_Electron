import { Component } from '@angular/core';
import { ElectronService } from './providers/electron.service';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig } from '../environments/environment';
import { DataService } from './components/_services/data.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(
    public electronService: ElectronService,
    private translate: TranslateService,
    private router: Router,
    private _dataService: DataService
  ) {

    /**
     * set language
     */
    translate.setDefaultLang('en');
    console.log('AppConfig', AppConfig);

    /**
     * check envrionment
     */
    if (electronService.isElectron()) {
      this._dataService.setAcitivityListener();
      console.log('Mode electron');
      console.log('Electron ipcRenderer', electronService.ipcRenderer);
      console.log('NodeJS childProcess', electronService.childProcess);
    } else {
      console.log('Mode web');
    }

    const localVersion = localStorage.getItem('app_version');
    const packageVersion = require('../../package.json').version;
    if (localVersion !== packageVersion) {
      localStorage.removeItem('app_version');
      this.router.navigate(['/login']);
    } else {
      localStorage.setItem('app_version', packageVersion);
    }
  }
}
