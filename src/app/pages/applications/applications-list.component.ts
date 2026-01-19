import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
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
  readonly deleteModal = signal<{ show: boolean; app: JobApplication | null }>({ show: false, app: null });
  readonly undoNotification = signal<{ show: boolean; app: JobApplication | null; countdown: number }>({ 
    show: false, 
    app: null, 
    countdown: 5 
  });
  private undoTimer: any = null;

  openDeleteModal(app: JobApplication): void {
    this.deleteModal.set({ show: true, app });
  }

  cancelDelete(): void {
    this.deleteModal.set({ show: false, app: null });
  }

  confirmDelete(): void {
    const app = this.deleteModal().app;
    if (app) {
      this.deleteModal.set({ show: false, app: null });
      this.jobApplicationsService.remove(app.id);
      this.showUndoNotification(app);
    }
  }

  private showUndoNotification(app: JobApplication): void {
    // Clear any existing timer
    if (this.undoTimer) {
      clearInterval(this.undoTimer);
    }

    this.undoNotification.set({ show: true, app, countdown: 5 });

    this.undoTimer = setInterval(() => {
      const current = this.undoNotification();
      const newCountdown = current.countdown - 1;

      if (newCountdown <= 0) {
        clearInterval(this.undoTimer);
        this.undoTimer = null;
        this.undoNotification.set({ show: false, app: null, countdown: 5 });
      } else {
        this.undoNotification.set({ ...current, countdown: newCountdown });
      }
    }, 1000);
  }

  undoDelete(): void {
    const notification = this.undoNotification();
    if (notification.app) {
      // Clear timer
      if (this.undoTimer) {
        clearInterval(this.undoTimer);
        this.undoTimer = null;
      }

      // Restore the application
      this.jobApplicationsService.create({
        company: notification.app.company,
        position: notification.app.position,
        status: notification.app.status,
        appliedDate: notification.app.appliedDate,
        interviewDate: notification.app.interviewDate,
        deadlineDate: notification.app.deadlineDate,
        notes: notification.app.notes
      });

      // Hide notification
      this.undoNotification.set({ show: false, app: null, countdown: 5 });
    }
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
