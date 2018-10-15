import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from './components/login/login.component';
import { TaskComponent } from './components/task/task.component';
import { AuthGuard } from './components/_guards/auth.guard';
import { DashboardComponent } from './components/dashboard/dashboard.component';

const appRoutes: Routes = [
    { path: 'task/:id', component: TaskComponent, canActivate: [AuthGuard] },
    { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
    { path: 'login', component: LoginComponent },

    // otherwise redirect to home
    { path: '**', redirectTo: '/dashboard' }
];

export const routing = RouterModule.forRoot(appRoutes, { useHash: true });