import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from './components/login/login.component';
import { TaskComponent } from './components/task/task.component';
import { AuthGuard } from './components/_guards/auth.guard';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { HelpComponent } from './components/help/help.component';
import { CheckComponent } from './components/check/check.component';

const appRoutes: Routes = [
    { path: 'task/:id', component: TaskComponent, canActivate: [AuthGuard] },
    { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
    { path: 'login', component: LoginComponent },
    { path: 'help', component: HelpComponent },
    { path: 'check', component: CheckComponent },

    // otherwise redirect to home
    { path: '**', redirectTo: '/dashboard' }
];

export const routing = RouterModule.forRoot(appRoutes, { useHash: true });
