
export enum DonorType {
  USAID = 'USAID',
  EU = 'EU',
  UN = 'UN',
  LOCAL_GOV = 'Local Gov'
}

export type ReportStyle = 'executive' | 'auditor';

export type UserRole = 'OFFICER' | 'MANAGER' | 'DIRECTOR' | 'AUDITOR' | 'SYSADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

/**
 * Persisted account data for authentication
 */
export interface UserAccount extends User {
  passwordHash: string; // Stored as plain string for this demo environment
  createdAt: string;
}

export interface HistoryItem {
  id: string;
  userId: string;
  userName: string;
  timestamp: number;
  donorType: DonorType;
  summary: string;
  report: string;
  downloadUrl: string;
}

export interface WorkflowInputs {
  field_notes_text: string;
  field_notes_voice?: File | null;
  field_notes_file?: File | null;
  donor_type: DonorType;
  language: string;
  style: ReportStyle;
}

export interface WorkflowResponse {
  task_id: string;
  workflow_id: string;
  status: 'succeeded' | 'failed' | 'running';
  outputs: {
    markdown_report: string;
    download_url?: string;
    executive_summary?: string;
  };
  error?: string;
}

export interface FeedbackContext {
  draftId: string | null;
  donorType: DonorType;
  style: ReportStyle;
  consistencyScore: number;
  lastAiAction: string;
}

export interface FeedbackPayload {
  workflow_run_id: string;
  draft_id: string;
  donor_type: string;
  style: string;
  transcription_correct: boolean;
  tone_rating: number;
  auditor_note: string;
  feedback_type: string;
  submitted_at: string;
}

/**
 * Interface for the read-only audit logs viewed by Managers.
 */
export interface AdminFeedbackRecord {
  workflow_run_id: string;
  submitted_at: string;
  donor_type: string;
  style: string;
  transcription_correct: string | number | boolean;
  tone_rating: number;
  auditor_note: string;
}

export interface AppState {
  user: User | null;
  isProcessing: boolean;
  isRecording: boolean;
  liveTranscription: string;
  step: 'input' | 'processing' | 'result' | 'history' | 'admin' | 'audit' | 'profile';
  progressMessage: string;
  error: string | null;
  report: string | null;
  downloadUrl: string | null;
  complianceChecked: boolean;
  history: HistoryItem[];
}
