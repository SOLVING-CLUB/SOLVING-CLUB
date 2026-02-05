/**
 * Comprehensive Quotation Types
 */

export type QuotationStatus = 'draft' | 'sent' | 'viewed' | 'commented' | 'signed' | 'rejected';
export type PaymentModel = 'weekly' | 'milestone' | 'upfront';

export interface ClientInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface AgencyInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  logo?: string;
}

export interface ProjectInfo {
  name: string;
  preparedOn: string;
  overview: string;
  features: string[];
}

export interface PhaseDeliverable {
  id: string;
  description: string;
}

export interface PhaseFeature {
  category: string;
  items: string[];
}

export interface QuotationPhase {
  id: string;
  number: number;
  name: string;
  description: string;
  duration: string;
  dateRange: string;
  deliverables: PhaseDeliverable[];
  features: PhaseFeature[];
}

export interface PricingAddOn {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface Pricing {
  totalPrice: number;
  currency: string;
  includes: string[];
  addOns: PricingAddOn[];
}

export interface PaymentScheduleItem {
  id: string;
  week: string;
  coverage: string;
  amount: number;
}

export interface PaymentTerms {
  model: PaymentModel;
  schedule: PaymentScheduleItem[];
  terms: string[];
}

export interface Signature {
  name: string;
  designation: string;
  signature: string; // base64
  date: string;
}

export interface Signatures {
  agency?: Signature;
  client?: Signature;
}

export interface Comment {
  id: string;
  section: string;
  text: string;
  author: 'agency' | 'client';
  timestamp: string;
  resolved: boolean;
}

export interface Quotation {
  id: string;
  shareableId: string;
  status: QuotationStatus;
  createdAt: string;
  updatedAt: string;
  
  // Basic Info
  client: ClientInfo;
  agency: AgencyInfo;
  project: ProjectInfo;
  
  // Phases
  phases: QuotationPhase[];
  
  // Pricing
  pricing: Pricing;
  
  // Payment
  payment: PaymentTerms;
  
  // Additional Sections
  clientResponsibilities: string[];
  assumptions: string[];
  support?: {
    initial?: {
      duration: string;
      includes: string[];
    };
    postSupport?: {
      standard?: {
        price: number;
        includes: string[];
      };
      premium?: {
        price: number;
        includes: string[];
      };
    };
  };
  intellectualProperty?: {
    sourceCodeOwnership: string[];
    license: string[];
  };
  terms?: {
    timeline: string[];
    scopeChanges: string[];
    testing: string[];
    storeApproval: string[];
    confidentiality: string[];
  };
  communication?: {
    channels: string[];
    meetings: string[];
    reporting: string[];
  };
  validity: string;
  
  // Signatures
  signatures?: Signatures;
  
  // Comments
  comments: Comment[];
  
  // Metadata
  version: number;
  versionHistory?: QuotationVersion[];
}

export interface QuotationVersion {
  version: number;
  timestamp: string;
  changedBy: string;
  changes: string[];
}
