import 'zone.js/dist/zone-mix';
import 'reflect-metadata';
import '../polyfills';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';

// NG Translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { ElectronService } from './providers/electron.service';

import { WebviewDirective } from './directives/webview.directive';

import { AppComponent } from './app.component';
import { TaskComponent } from './components/task/task.component';
import { LoginComponent } from './components/login/login.component';

import { AngularFontAwesomeModule } from 'angular-font-awesome';
import { AlertComponent } from './components/_directives/alert/alert.component';
import { AlertService } from './components/_services/alert.service';
import { routing } from './app.routing';
import { AuthGuard } from './components/_guards/auth.guard';
import { TimeConvertPipe } from './components/_pipes/time-convert.pipe';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { HttpService } from './components/_services/http.service';
import { DataService } from './components/_services/data.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';

import { ObjectKeyPipe } from './components/_pipes/object-key.pipe';
import { AboutComponent } from './components/about/about.component';
import { HelpComponent } from './components/help/help.component';
import { CheckComponent } from './components/check/check.component';
import { NoteComponent } from './components/modals/note/note.component';
import { SettingModalComponent } from './components/modals/setting-modal/setting-modal.component';
import { HeaderComponent } from './components/header/header.component';


// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    TaskComponent,
    WebviewDirective,
    LoginComponent,
    AlertComponent,
    TimeConvertPipe,
    DashboardComponent,
    ObjectKeyPipe,
    AboutComponent,
    HelpComponent,
    CheckComponent,
    NoteComponent,
    SettingModalComponent,
    HeaderComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    HttpClientModule,
    AngularFontAwesomeModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (HttpLoaderFactory),
        deps: [HttpClient]
      }
    }),
    routing,
    FormsModule,
    BrowserAnimationsModule,
    MatMenuModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatToolbarModule,
    MatDialogModule,
    MatIconModule,
    MatRadioModule,
    MatCheckboxModule,
    MatSelectModule,
    NgxMaterialTimepickerModule.forRoot()
  ],
  providers: [
    ElectronService,
    AlertService,
    AuthGuard,
    HttpService,
    DataService
  ],
  entryComponents: [
    NoteComponent,
    SettingModalComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
