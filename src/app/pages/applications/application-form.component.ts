import { NgFor, NgIf } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  JobApplication,
  JobApplicationCreate,
  JobApplicationStatus
} from '../../models/job-application.model';
import { JobApplicationsService } from '../../services/job-applications.service';

const STATUSES: readonly JobApplicationStatus[] = ['Applied', 'Interviewing', 'Accepted'];

@Component({
  selector: 'app-application-form',
  imports: [ReactiveFormsModule, RouterLink, NgIf, NgFor],
  templateUrl: './application-form.component.html',
  styleUrl: './application-form.component.scss'
})
export class ApplicationFormComponent {
  readonly statuses = STATUSES;

  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly jobApplicationsService = inject(JobApplicationsService);

  private readonly id = signal<string | null>(null);
  readonly isEdit = computed(() => this.id() !== null);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly showSuccessNotification = signal(false);

  readonly form = this.fb.nonNullable.group({
    company: ['', [Validators.required, Validators.minLength(2)]],
    position: ['', [Validators.required, Validators.minLength(2)]],
    status: this.fb.nonNullable.control<JobApplicationStatus>('Applied', [Validators.required]),
    appliedDate: [''],
    interviewDate: [''],
    deadlineDate: [''],
    notes: ['']
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);

    if (id) {
      const existing = this.jobApplicationsService.getById(id);
      if (!existing) {
        this.notFound.set(true);
        this.loading.set(false);
        return;
      }

      this.applyExisting(existing);
    }

    this.form.addValidators(this.duplicateCompanyPositionValidator());
    this.form.updateValueAndValidity({ emitEvent: false });

    this.loading.set(false);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const company = this.form.controls.company.value.trim();
    const position = this.form.controls.position.value.trim();

    const payload: JobApplicationCreate = {
      company,
      position,
      status: this.form.controls.status.value,
      appliedDate: this.form.controls.appliedDate.value || undefined,
      interviewDate: this.form.controls.interviewDate.value || undefined,
      deadlineDate: this.form.controls.deadlineDate.value || undefined,
      notes: this.form.controls.notes.value?.trim() || undefined
    };

    const id = this.id();
    if (id) {
      this.jobApplicationsService.update(id, payload);
    } else {
      this.jobApplicationsService.create(payload);
    }

    this.showSuccessNotification.set(true);
    setTimeout(() => {
      void this.router.navigateByUrl('/applications');
    }, 600);
  }

  private applyExisting(existing: JobApplication): void {
    this.form.patchValue({
      company: existing.company,
      position: existing.position,
      status: existing.status,
      appliedDate: existing.appliedDate ?? '',
      interviewDate: existing.interviewDate ?? '',
      deadlineDate: existing.deadlineDate ?? '',
      notes: existing.notes ?? ''
    });
  }

  private duplicateCompanyPositionValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const group = control as any;
      const companyRaw = group?.controls?.company?.value;
      const positionRaw = group?.controls?.position?.value;

      const company = typeof companyRaw === 'string' ? companyRaw.trim() : '';
      const position = typeof positionRaw === 'string' ? positionRaw.trim() : '';

      if (!company || !position) return null;

      const companyKey = company.toLowerCase();
      const positionKey = position.toLowerCase();
      const id = this.id();

      const duplicateExists = this.jobApplicationsService
        .getSnapshot()
        .some(
          (app) =>
            app.id !== id &&
            app.company.trim().toLowerCase() === companyKey &&
            app.position.trim().toLowerCase() === positionKey
        );

      return duplicateExists ? { duplicateCompanyPosition: true } : null;
    };
  }
}
