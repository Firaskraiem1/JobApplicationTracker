import { AsyncPipe, NgFor, NgIf, NgClass } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { JobApplication } from '../../models/job-application.model';
import { JobApplicationsService } from '../../services/job-applications.service';

type CalendarEventType = 'Deadline' | 'Interview' | 'Applied';

interface CalendarEvent {
  date: string; // YYYY-MM-DD
  type: CalendarEventType;
  title: string;
}

function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}

function toYmd(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function isUpcoming(dateYmd: string, daysAhead: number): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(`${dateYmd}T00:00:00`);
  const deltaMs = target.getTime() - today.getTime();
  const deltaDays = Math.floor(deltaMs / (1000 * 60 * 60 * 24));
  return deltaDays >= 0 && deltaDays <= daysAhead;
}

@Component({
  selector: 'app-calendar',
  imports: [NgIf, NgFor, AsyncPipe, NgClass],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class CalendarComponent {
  private readonly jobApplicationsService = inject(JobApplicationsService);

  readonly selectedDate = signal<string>(toYmd(new Date()));

  private readonly monthCursor = signal<Date>((() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  })());

  readonly monthLabel = computed(() =>
    this.monthCursor().toLocaleString(undefined, { month: 'long', year: 'numeric' })
  );

  readonly days = computed(() => {
    const cursor = this.monthCursor();
    const year = cursor.getFullYear();
    const month = cursor.getMonth();

    const first = new Date(year, month, 1);
    const startDay = (first.getDay() + 6) % 7; // Monday = 0

    const start = new Date(year, month, 1 - startDay);
    const out: { date: string; inMonth: boolean }[] = [];

    for (let i = 0; i < 42; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      out.push({ date: toYmd(d), inMonth: d.getMonth() === month });
    }

    return out;
  });

  readonly events$: Observable<Record<string, CalendarEvent[]>> = this.jobApplicationsService.applications$.pipe(
    map((apps) => this.toEventsMap(apps))
  );

  prevMonth(): void {
    const c = this.monthCursor();
    const next = new Date(c);
    next.setMonth(c.getMonth() - 1);
    this.monthCursor.set(next);
  }

  nextMonth(): void {
    const c = this.monthCursor();
    const next = new Date(c);
    next.setMonth(c.getMonth() + 1);
    this.monthCursor.set(next);
  }

  jumpToDate(value: string): void {
    if (!value) return;
    // Expect YYYY-MM-DD from <input type="date">
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return;

    this.selectedDate.set(value);

    const monthStart = new Date(parsed);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    this.monthCursor.set(monthStart);
  }

  upcomingClass(event: CalendarEvent): string {
    if (event.type === 'Deadline' && isUpcoming(event.date, 7)) return 'upcoming-deadline';
    if (event.type === 'Interview' && isUpcoming(event.date, 7)) return 'upcoming-interview';
    return '';
  }

  cellHighlightClass(date: string, dayEvents: CalendarEvent[] | undefined): string {
    if (!dayEvents || dayEvents.length === 0) return '';

    const hasUpcomingDeadline = dayEvents.some(
      (e) => e.type === 'Deadline' && isUpcoming(date, 7)
    );
    if (hasUpcomingDeadline) return 'cell-upcoming-deadline';

    const hasUpcomingInterview = dayEvents.some(
      (e) => e.type === 'Interview' && isUpcoming(date, 7)
    );
    if (hasUpcomingInterview) return 'cell-upcoming-interview';

    return '';
  }

  private toEventsMap(apps: JobApplication[]): Record<string, CalendarEvent[]> {
    const mapOut: Record<string, CalendarEvent[]> = {};

    for (const app of apps) {
      const title = `${app.company} - ${app.position}`;

      const add = (date: string | undefined, type: CalendarEventType) => {
        if (!date) return;
        if (!mapOut[date]) mapOut[date] = [];
        mapOut[date].push({ date, type, title });
      };

      add(app.deadlineDate, 'Deadline');
      add(app.interviewDate, 'Interview');
      add(app.appliedDate, 'Applied');
    }

    for (const date of Object.keys(mapOut)) {
      mapOut[date].sort((a, b) => a.type.localeCompare(b.type));
    }

    return mapOut;
  }
}
