// types/index.ts
export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface Job {
  id: string;
  originalVideoName: string;
  status: JobStatus;
  progress: number;
  createdAt: string;
}