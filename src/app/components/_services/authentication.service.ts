import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthenticationService {
  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  login(email: string, password: string):Promise<any> {
      // return this.http.post<any>(`/users/authenticate`, { username: username, password: password })
      //     .pipe(map(user => {
      //         // login successful if there's a jwt token in the response
      //         if (user && user.token) {
      //             // store user details and jwt token in local storage to keep user logged in between page refreshes
      //             localStorage.setItem('currentUser', JSON.stringify(user));
      //         }

      //         return user;
      //     }));
    if (email === 'test@gmail.com' && password === 'test1234') {
      localStorage.setItem('currentUser', JSON.stringify({
        email: email,
        password: password
      }));
      return Promise.resolve();
    } else {
      return Promise.reject('Wrong credential');
    }
  }

  logout() {
    // remove user from local storage to log user out
    localStorage.removeItem('currentUser');
    this.router.navigate(['login']);
  }
}
