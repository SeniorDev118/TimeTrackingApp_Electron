import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { AuthGuard } from './components/_guards/auth.guard';
import { TaskDetailComponent } from './components/task-detail/task-detail.component';
import { RegisterComponent } from './components/register/register.component';

const appRoutes: Routes = [
    { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
    { path: 'login', component: LoginComponent },
    { path: 'task_detail/:id', component: TaskDetailComponent, canActivate: [AuthGuard] },
    { path: 'register', component: RegisterComponent },

    // otherwise redirect to home
    { path: '**', redirectTo: '/home' }
];

export const routing = RouterModule.forRoot(appRoutes, { useHash: true });