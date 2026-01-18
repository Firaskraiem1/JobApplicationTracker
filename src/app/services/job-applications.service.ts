import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  JobApplication,
  JobApplicationCreate,
  JobApplicationUpdate
} from '../models/job-application.model';

const STORAGE_KEY = 'jobApplicationTracker.applications.v1';

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function asOptionalYmd(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed;
}

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeStoredApplication(raw: unknown): JobApplication | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const id = asOptionalString(obj['id']);
  const company = asOptionalString(obj['company']);
  const position = asOptionalString(obj['position']);
  const statusRaw = asOptionalString(obj['status']);
  const status = (statusRaw === 'Applied' || statusRaw === 'Interviewing' || statusRaw === 'Accepted'
    ? statusRaw
    : 'Applied');

  if (!id || !company || !position) return null;

  // Support both camelCase (frontend) and snake_case (DRF) keys
  const appliedDate = asOptionalYmd(obj['appliedDate'] ?? obj['applied_date']);
  const interviewDate = asOptionalYmd(obj['interviewDate'] ?? obj['interview_date']);
  const deadlineDate = asOptionalYmd(obj['deadlineDate'] ?? obj['deadline_date']);
  const notes = asOptionalString(obj['notes']);

  const createdAt = asOptionalString(obj['createdAt'] ?? obj['created_at']) ?? nowIso();
  const updatedAt = asOptionalString(obj['updatedAt'] ?? obj['updated_at']) ?? createdAt;

  return {
    id,
    company,
    position,
    status,
    appliedDate,
    interviewDate,
    deadlineDate,
    notes,
    createdAt,
    updatedAt
  };
}

@Injectable({
  providedIn: 'root'
})
export class JobApplicationsService {
  private readonly applicationsSubject = new BehaviorSubject<JobApplication[]>(this.load());

  readonly applications$ = this.applicationsSubject.asObservable();

  getSnapshot(): JobApplication[] {
    return this.applicationsSubject.value;
  }

  getById(id: string): JobApplication | undefined {
    return this.getSnapshot().find((app) => app.id === id);
  }

  create(data: JobApplicationCreate): JobApplication {
    const created: JobApplication = {
      id: createId(),
      ...data,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };

    const next = [created, ...this.getSnapshot()];
    this.set(next);
    return created;
  }

  update(id: string, patch: JobApplicationUpdate): JobApplication | undefined {
    const current = this.getSnapshot();
    const index = current.findIndex((a) => a.id === id);
    if (index < 0) return undefined;

    const updated: JobApplication = {
      ...current[index],
      ...patch,
      updatedAt: nowIso()
    };

    const next = current.slice();
    next[index] = updated;
    this.set(next);
    return updated;
  }

  remove(id: string): boolean {
    const current = this.getSnapshot();
    const next = current.filter((a) => a.id !== id);
    if (next.length === current.length) return false;

    this.set(next);
    return true;
  }

  private set(next: JobApplication[]): void {
    this.applicationsSubject.next(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // If storage is unavailable (privacy mode, disabled storage), keep in-memory state.
    }
  }

  private load(): JobApplication[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      } catch {
        // ignore
      }
      return [];
    }

    const parsed = safeJsonParse<unknown>(raw);

    // Accept both an array and a DRF-like paginated object { results: [] }
    const items: unknown[] = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object' && Array.isArray((parsed as any).results)
        ? ((parsed as any).results as unknown[])
        : [];

    return items.map(normalizeStoredApplication).filter((x): x is JobApplication => x !== null);
  }
}
