/**
 * Document Form Types
 */
export type DocumentType = 'quotation' | 'invoice' | 'contract' | 'proposal';

export interface DocumentFormData {
  // Basic Info
  type: DocumentType;
  title: string;
  documentNumber?: string;
  
  // Client Info
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  
  // Project Info
  projectName: string;
  projectDescription?: string;
  
  // Financial Details
  items: DocumentItem[];
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  total?: number;
  currency?: string;
  
  // Terms & Conditions
  paymentTerms?: string;
  validityPeriod?: string;
  notes?: string;
  termsAndConditions?: string;
  
  // Dates
  issueDate: string;
  dueDate?: string;
  
  // Status
  status?: 'draft' | 'sent' | 'approved' | 'rejected';
}

export interface DocumentItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface DocumentTemplate {
  type: DocumentType;
  name: string;
  fields: string[];
}
