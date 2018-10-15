import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertService } from '../_services/alert.service';
import { ElectronService } from 'ngx-electron';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  returnUrl: string;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private alertService: AlertService,
    private _electronService: ElectronService
  ) {}

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      email: ['', [
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$')
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6)
      ]]
    });

    // reset login status
    localStorage.removeItem('userToken');

    // get return url from route parameters or default to '/'
    // this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
    this.returnUrl = '/home';
  }

  // convenience getter for easy access to form fields
  get f() { return this.loginForm.controls; }

  onSubmit() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this._electronService.ipcRenderer.send('login-call', {
      url: '/trackly/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      formData: {
        email: this.f.email.value,
        password: this.f.password.value
      }
    });
    this._electronService.ipcRenderer.once('login-call-reply', (event, arg) => {
      if (arg['success'] && arg['token']) {
        localStorage.setItem('userToken', arg['token']);
        this.router.navigate([this.returnUrl]);
      } else {
        this.alertService.error('Wrong email or password.');
        this.loading = false;
      }
    });
  }
}

