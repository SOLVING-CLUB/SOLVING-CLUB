import { Document } from "@/lib/types/documents";

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
    // For web, use a URL from your backend/storage service
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
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
  {
    id: '4',
    title: 'Invoice #INV-2026-001',
    type: 'invoice',
    clientName: 'XYZ Ltd.',
    projectName: 'Mobile App Development',
    createdAt: '2026-01-08T00:00:00Z',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileSize: 150000,
    description: 'Invoice for mobile app development services',
    status: 'sent',
  },
];

/**
 * Get documents by type
 */
export const getDocumentsByType = (type: string): Document[] => {
  if (type === 'all') return mockDocuments;
  return mockDocuments.filter(doc => doc.type === type);
};

/**
 * Get document by ID
 */
export const getDocumentById = (id: string): Document | undefined => {
  return mockDocuments.find(doc => doc.id === id);
};
