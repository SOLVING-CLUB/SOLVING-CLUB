import { Quotation } from "@/lib/types/quotation";

const STORAGE_KEY_PREFIX = 'quotation_';
const STORAGE_SHARED_PREFIX = 'quotation_shared_';

/**
 * Quotation Storage Utilities
 * Handles saving and retrieving quotations from localStorage
 * In production, this would connect to your backend/API
 */

/**
 * Generate unique ID
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Generate shareable ID
 */
function generateShareableId(): string {
  return 'q_' + generateId();
}

/**
 * Get all saved quotations
 */
export function getAllQuotations(): Quotation[] {
  try {
    const keys = Object.keys(localStorage);
    const quotationKeys = keys.filter(key => key.startsWith(STORAGE_KEY_PREFIX));
    return quotationKeys.map(key => {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }).filter(Boolean);
  } catch (error) {
    console.error('Error loading quotations:', error);
    return [];
  }
}

/**
 * Get quotation by ID
 */
export function getQuotationById(id: string): Quotation | null {
  try {
    const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading quotation:', error);
    return null;
  }
}

/**
 * Get quotation by shareable ID (for public viewing)
 */
export function getQuotationByShareableId(shareableId: string): Quotation | null {
  try {
    // First try shared storage
    const sharedData = localStorage.getItem(`${STORAGE_SHARED_PREFIX}${shareableId}`);
    if (sharedData) {
      return JSON.parse(sharedData);
    }
    
    // Then try regular storage
    const quotations = getAllQuotations();
    return quotations.find(q => q.shareableId === shareableId) || null;
  } catch (error) {
    console.error('Error loading shared quotation:', error);
    return null;
  }
}

/**
 * Save quotation
 */
export function saveQuotation(quotation: Partial<Quotation>): Quotation {
  const now = new Date().toISOString();
  const id = quotation.id || generateId();
  const shareableId = quotation.shareableId || generateShareableId();
  
  const fullQuotation: Quotation = {
    id,
    shareableId,
    status: quotation.status || 'draft',
    createdAt: quotation.createdAt || now,
    updatedAt: now,
    client: quotation.client || { name: '' },
    agency: quotation.agency || {
      name: 'Solving Club',
      email: 'Contactus@solvingclub.org',
      phone: '6304725752',
      address: 'Hyderabad, Telangana',
    },
    project: quotation.project || {
      name: '',
      preparedOn: new Date().toISOString().split('T')[0],
      overview: '',
      features: [],
    },
    phases: quotation.phases || [],
    pricing: quotation.pricing || {
      totalPrice: 0,
      currency: 'INR',
      includes: [],
      addOns: [],
    },
    payment: quotation.payment || {
      model: 'weekly',
      schedule: [],
      terms: [],
    },
    clientResponsibilities: quotation.clientResponsibilities || [],
    assumptions: quotation.assumptions || [],
    support: quotation.support,
    intellectualProperty: quotation.intellectualProperty,
    terms: quotation.terms,
    communication: quotation.communication,
    validity: quotation.validity || '20 days from the date of issue',
    signatures: quotation.signatures,
    comments: quotation.comments || [],
    version: quotation.version || 1,
    versionHistory: quotation.versionHistory || [],
  };

  // Save to regular storage
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${id}`, JSON.stringify(fullQuotation));
  
  // Also save to shared storage for public access
  localStorage.setItem(`${STORAGE_SHARED_PREFIX}${shareableId}`, JSON.stringify(fullQuotation));
  
  return fullQuotation;
}

/**
 * Update quotation
 */
export function updateQuotation(id: string, updates: Partial<Quotation>): Quotation | null {
  const existing = getQuotationById(id);
  if (!existing) return null;

  const updated: Quotation = {
    ...existing,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
    version: existing.version + 1,
    versionHistory: [
      ...(existing.versionHistory || []),
      {
        version: existing.version + 1,
        timestamp: new Date().toISOString(),
        changedBy: 'agency', // In production, get from auth
        changes: Object.keys(updates),
      },
    ],
  };

  localStorage.setItem(`${STORAGE_KEY_PREFIX}${id}`, JSON.stringify(updated));
  localStorage.setItem(`${STORAGE_SHARED_PREFIX}${updated.shareableId}`, JSON.stringify(updated));
  
  return updated;
}

/**
 * Delete quotation
 */
export function deleteQuotation(id: string): boolean {
  try {
    const quotation = getQuotationById(id);
    if (!quotation) return false;

    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${id}`);
    localStorage.removeItem(`${STORAGE_SHARED_PREFIX}${quotation.shareableId}`);
    return true;
  } catch (error) {
    console.error('Error deleting quotation:', error);
    return false;
  }
}

/**
 * Add comment to quotation
 */
export function addComment(quotationId: string, comment: Omit<import("@/lib/types/quotation").Comment, 'id' | 'timestamp'>): Quotation | null {
  const quotation = getQuotationById(quotationId);
  if (!quotation) return null;

  const newComment = {
    ...comment,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };

  return updateQuotation(quotationId, {
    comments: [...quotation.comments, newComment],
    status: quotation.status === 'sent' ? 'commented' : quotation.status,
  });
}

/**
 * Update signature
 */
export function updateSignature(quotationId: string, signatureType: 'agency' | 'client', signature: Signature): Quotation | null {
  const quotation = getQuotationById(quotationId);
  if (!quotation) return null;

  const signatures = quotation.signatures || {};
  signatures[signatureType] = signature;

  const newStatus = signatures.agency && signatures.client ? 'signed' : quotation.status;

  return updateQuotation(quotationId, {
    signatures,
    status: newStatus,
  });
}

/**
 * Get quotations by status
 */
export function getQuotationsByStatus(status: QuotationStatus): Quotation[] {
  return getAllQuotations().filter(q => q.status === status);
}
