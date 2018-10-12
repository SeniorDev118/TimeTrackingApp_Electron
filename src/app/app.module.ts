import 'zone.js/dist/zone-mix';
import 'reflect-metadata';
import '../polyfills';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgxElectronModule } from 'ngx-electron';

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
import { TimeConvertPipe } from './components/_pipes/time-convert.pipe';
import { JwtInterceptorService } from './components/_services/jwt.interceptor.service';
import { ErrorInterceptorService } from './components/_services/error.interceptor.service';

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
    TimeConvertPipe
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
    NgxElectronModule
  ],
  providers: [
    ElectronService,
    AuthenticationService,
    AlertService,
    AuthGuard,
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptorService, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptorService, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
