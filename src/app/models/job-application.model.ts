export type JobApplicationStatus = 'Applied' | 'Interviewing' | 'Accepted';

export interface JobApplication {
  id: string;
  company: string;
  position: string;
  status: JobApplicationStatus;
  appliedDate?: string; 
  interviewDate?: string; 
  deadlineDate?: string; 
  notes?: string;
  createdAt: string; 
  updatedAt: string;
}

export type JobApplicationCreate = Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>;

export type JobApplicationUpdate = Partial<JobApplicationCreate>;
