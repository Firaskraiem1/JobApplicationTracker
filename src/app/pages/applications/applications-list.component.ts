import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { JobApplication } from '../../models/job-application.model';
import { JobApplicationsService } from '../../services/job-applications.service';

function daysUntil(dateYmd: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(`${dateYmd}T00:00:00`);
  const deltaMs = target.getTime() - today.getTime();
  return Math.floor(deltaMs / (1000 * 60 * 60 * 24));
}

function isUpcoming(dateYmd: string, daysAhead: number): boolean {
  const d = daysUntil(dateYmd);
  return d >= 0 && d <= daysAhead;
}

@Component({
  selector: 'app-applications-list',
  imports: [NgIf, NgFor, AsyncPipe, RouterLink],
  templateUrl: './applications-list.component.html',
  styleUrl: './applications-list.component.scss'
})
export class ApplicationsListComponent {
  private readonly jobApplicationsService = inject(JobApplicationsService);

  readonly applications$: Observable<JobApplication[]> = this.jobApplicationsService.applications$;

  delete(id: string): void {
    const ok = confirm('Delete this job application?');
    if (!ok) return;
    this.jobApplicationsService.remove(id);
  }

  upcomingIndicator(app: JobApplication): { label: string; kind: 'deadline' | 'interview' } | null {
    if (app.deadlineDate && isUpcoming(app.deadlineDate, 7)) {
      const d = daysUntil(app.deadlineDate);
      return { label: `Deadline in ${d}d`, kind: 'deadline' };
    }

    if (app.interviewDate && isUpcoming(app.interviewDate, 7)) {
      const d = daysUntil(app.interviewDate);
      return { label: `Interview in ${d}d`, kind: 'interview' };
    }

    return null;
  }

  trackById(_: number, item: JobApplication): string {
    return item.id;
  }
}
