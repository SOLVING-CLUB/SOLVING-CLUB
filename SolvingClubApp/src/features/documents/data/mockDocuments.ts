import {Document} from '../types';

/**
 * Mock Documents Data
 * In production, this would come from your backend/API
 */
export const mockDocuments: Document[] = [
  {
    id: '1',
    title: 'Project Quotation - Job Portal Mobile App',
    type: 'quotation',
    clientName: 'Absolve IT and HR Private Limited',
    projectName: 'Job Portal Mobile Application',
    createdAt: '2026-01-13T00:00:00Z',
    // Note: For local files, use a URL from your backend/storage service
    // For testing, you can use a public PDF URL or implement file picker
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', // Replace with actual PDF URL
    fileSize: 245760, // ~240 KB
    description: 'Complete project quotation for Job Portal Mobile App development',
    status: 'sent',
  },
  {
    id: '2',
    title: 'Project Proposal - E-Commerce Platform',
    type: 'proposal',
    clientName: 'Tech Solutions Inc.',
    projectName: 'E-Commerce Platform',
    createdAt: '2026-01-10T00:00:00Z',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileSize: 180000,
    description: 'Detailed proposal for e-commerce platform development',
    status: 'draft',
  },
  {
    id: '3',
    title: 'Service Contract - Web Development',
    type: 'contract',
    clientName: 'ABC Corporation',
    projectName: 'Corporate Website',
    createdAt: '2026-01-05T00:00:00Z',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileSize: 320000,
    description: 'Service contract for web development project',
    status: 'approved',
  },
];

/**
 * Get documents by type
 */
export const getDocumentsByType = (type: string): Document[] => {
  return mockDocuments.filter(doc => doc.type === type);
};

/**
 * Get document by ID
 */
export const getDocumentById = (id: string): Document | undefined => {
  return mockDocuments.find(doc => doc.id === id);
};
