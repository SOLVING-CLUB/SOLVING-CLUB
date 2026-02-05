import { Document } from "@/lib/types/documents";
import { DocumentFormData } from "@/lib/types/documentForm";

/**
 * Document Storage Utilities
 * Handles saving and retrieving documents from localStorage
 * In production, this would connect to your backend/API
 */

const STORAGE_KEY = 'solvingClub_documents';

/**
 * Get all saved documents
 */
export function getSavedDocuments(): Document[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading documents:', error);
    return [];
  }
}

/**
 * Save a new document
 */
export function saveDocument(formData: DocumentFormData): Document {
  const documents = getSavedDocuments();
  const newDocument: Document = {
    id: Date.now().toString(),
    title: formData.title,
    type: formData.type,
    clientName: formData.clientName,
    projectName: formData.projectName,
    createdAt: formData.issueDate,
    updatedAt: new Date().toISOString(),
    fileUrl: '', // No file URL for generated documents
    fileSize: 0,
    description: formData.projectDescription,
    status: formData.status || 'draft',
    // Store form data for editing
    formData: formData,
  };

  documents.push(newDocument);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  return newDocument;
}

/**
 * Update an existing document
 */
export function updateDocument(id: string, formData: DocumentFormData): Document | null {
  const documents = getSavedDocuments();
  const index = documents.findIndex(doc => doc.id === id);
  
  if (index === -1) return null;

  const updatedDocument: Document = {
    ...documents[index],
    title: formData.title,
    type: formData.type,
    clientName: formData.clientName,
    projectName: formData.projectName,
    updatedAt: new Date().toISOString(),
    description: formData.projectDescription,
    status: formData.status || documents[index].status,
    formData: formData,
  };

  documents[index] = updatedDocument;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  return updatedDocument;
}

/**
 * Get document by ID
 */
export function getDocumentById(id: string): Document | undefined {
  const documents = getSavedDocuments();
  return documents.find(doc => doc.id === id);
}

/**
 * Delete a document
 */
export function deleteDocument(id: string): boolean {
  const documents = getSavedDocuments();
  const filtered = documents.filter(doc => doc.id !== id);
  
  if (filtered.length === documents.length) return false;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Get documents by type
 */
export function getDocumentsByType(type: string): Document[] {
  const documents = getSavedDocuments();
  if (type === 'all') return documents;
  return documents.filter(doc => doc.type === type);
}
