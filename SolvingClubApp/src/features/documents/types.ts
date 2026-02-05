/**
 * Document Types
 */
export type DocumentType = 'quotation' | 'invoice' | 'contract' | 'proposal' | 'other';

export interface Document {
  id: string;
  title: string;
  type: DocumentType;
  clientName?: string;
  projectName?: string;
  createdAt: string;
  updatedAt?: string;
  fileUrl: string;
  fileSize?: number;
  description?: string;
  status?: 'draft' | 'sent' | 'approved' | 'rejected';
}

export interface DocumentCategory {
  type: DocumentType;
  label: string;
  icon: string;
  count: number;
}
