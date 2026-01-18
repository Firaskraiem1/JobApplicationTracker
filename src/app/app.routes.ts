import { Routes } from '@angular/router';
import { ApplicationFormComponent } from './pages/applications/application-form.component';
import { ApplicationsListComponent } from './pages/applications/applications-list.component';
import { CalendarComponent } from './pages/calendar/calendar.component';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', redirectTo: 'applications' },
	{ path: 'applications', component: ApplicationsListComponent },
	{ path: 'applications/new', component: ApplicationFormComponent },
	{ path: 'applications/:id/edit', component: ApplicationFormComponent },
	{ path: 'calendar', component: CalendarComponent },
	{ path: '**', redirectTo: 'applications' }
];
