/**
 * Document Types for Web App
 */
export type DocumentType = 'quotation' | 'invoice' | 'contract' | 'proposal' | 'other';

import { DocumentFormData } from './documentForm';

export interface Document {
  id: string;
  title: string;
  type: DocumentType;
  clientName?: string;
  projectName?: string;
  createdAt: string;
  updatedAt?: string;
  fileUrl?: string;
  fileSize?: number;
  description?: string;
  status?: 'draft' | 'sent' | 'approved' | 'rejected';
  formData?: DocumentFormData; // Store form data for editing
}

export interface DocumentCategory {
  type: DocumentType;
  label: string;
  icon: string;
  count: number;
}
