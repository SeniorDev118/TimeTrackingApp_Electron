import 'zone.js/dist/zone-mix';
import 'reflect-metadata';
import '../polyfills';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DataTableModule } from 'angular-6-datatable';

import { HttpClientModule, HttpClient } from '@angular/common/http';
import { NgxElectronModule } from 'ngx-electron';
import { NgxHmCarouselModule } from 'ngx-hm-carousel';
import 'hammerjs';

// NG Translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { ElectronService } from './providers/electron.service';

import { WebviewDirective } from './directives/webview.directive';

import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';

import { AngularFontAwesomeModule } from 'angular-font-awesome';
import { AuthenticationService } from './components/_services/authentication.service';
import { AlertComponent } from './components/_directives/alert/alert.component';
import { AlertService } from './components/_services/alert.service';
import { HeaderComponent } from './components/header/header.component';
import { routing } from './app.routing';
import { AuthGuard } from './components/_guards/auth.guard';
import { TaskDetailComponent } from './components/task-detail/task-detail.component';
import { RegisterComponent } from './components/register/register.component';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    WebviewDirective,
    LoginComponent,
    AlertComponent,
    HeaderComponent,
    TaskDetailComponent,
    RegisterComponent
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
    NgxElectronModule,
    DataTableModule,
    NgxHmCarouselModule
  ],
  providers: [
    ElectronService,
    AuthenticationService,
    AlertService,
    AuthGuard
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
