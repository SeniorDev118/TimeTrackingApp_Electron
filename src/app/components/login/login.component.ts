import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertService } from '../_services/alert.service';
import { HttpService } from '../_services/http.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup; // login form
  loading = false; // page load flag
  submitted = false; // submit form flag
  returnUrl: string; // return url

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private alertService: AlertService,
    private _httpService: HttpService
  ) {}

  ngOnInit() {
    /** define login form */
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
    localStorage.removeItem('userInformation');

    // get return url from route parameters or default to '/'
    // this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
    this.returnUrl = '/home';
  }

  // convenience getter for easy access to form fields
  get f() { return this.loginForm.controls; }

  /**
   * submit login credential
   */
  onSubmit() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this._httpService.postCall(
      'trackly/login',
      {
        email: this.f.email.value,
        password: this.f.password.value
    }).then((res) => {
      console.log(res);
      if (res['data']) {
        localStorage.setItem('userInformation', JSON.stringify(res['data']));
        this.router.navigate([this.returnUrl]);
      }
    }).catch((err) => {
      if (!err) {
        this.alertService.error('Wrong email or password.');
      } else {
        this.alertService.error('Please try again later.');
      }
      this.loading = false;
    });
  }
}

