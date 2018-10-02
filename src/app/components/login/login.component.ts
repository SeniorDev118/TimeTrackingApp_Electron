import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
// import { Http } from '@angular/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
  }

  onFormSubmit(data) {
    console.log(data);
    if (data.email == "test@mail.com" && data.password == "test123") {
        console.log(data.email);
        localStorage.setItem('email', data.email);
        this.router.navigateByUrl('/'); 
    }
    // this.http.post('http://localhost:8080/api/checkuser', data)
    // .subscribe(data => {
    //   if(data["_body"] != 'invalid') {
    //   } else {
    //     alert("Invalid User");
    //   }
    // });
  }

}
