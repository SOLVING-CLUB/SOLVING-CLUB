import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Edit, Trash2, Eye } from "lucide-react";
import { Document, DocumentType } from "@/lib/types/documents";
import { useLocation } from "wouter";
import { deleteDocument } from "@/lib/data/documentStorage";
import { toast } from "sonner";

interface DocumentCardProps {
  document: Document;
}

/**
 * Get icon and color for document type
 */
const getDocumentTypeInfo = (type: DocumentType) => {
  switch (type) {
    case 'quotation':
      return { icon: '📄', color: 'bg-blue-500', label: 'Quotation' };
    case 'invoice':
      return { icon: '💰', color: 'bg-green-500', label: 'Invoice' };
    case 'contract':
      return { icon: '📝', color: 'bg-purple-500', label: 'Contract' };
    case 'proposal':
      return { icon: '📋', color: 'bg-orange-500', label: 'Proposal' };
    default:
      return { icon: '📑', color: 'bg-gray-500', label: 'Document' };
  }
};

/**
 * Format file size
 */
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Format date
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Get status color
 */
const getStatusColor = (status?: string) => {
  switch (status) {
    case 'approved':
      return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
    case 'rejected':
      return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
    case 'sent':
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
    case 'draft':
      return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
    default:
      return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20';
  }
};

/**
 * Document Card Component
 */
export function DocumentCard({ document }: DocumentCardProps) {
  const [, setLocation] = useLocation();
  const typeInfo = getDocumentTypeInfo(document.type);

  const handleView = () => {
    setLocation(`/dashboard/documents/create?view=${document.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocation(`/dashboard/documents/edit/${document.id}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this document?')) {
      const success = deleteDocument(document.id);
      if (success) {
        toast.success('Document deleted successfully');
        window.location.reload(); // Refresh to update list
      } else {
        toast.error('Failed to delete document');
      }
    }
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleView}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={`${typeInfo.color} text-white p-2 rounded-lg text-xl`}>
              {typeInfo.icon}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg mb-2 line-clamp-2">
                {document.title}
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={typeInfo.color.replace('bg-', 'border-').replace('-500', '-500/20')}>
                  {typeInfo.label}
                </Badge>
                {document.status && (
                  <Badge variant="outline" className={getStatusColor(document.status)}>
                    {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleView}
              className="shrink-0"
              title="View"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEdit}
              className="shrink-0"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="shrink-0 text-destructive hover:text-destructive"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {(document.clientName || document.projectName) && (
          <div className="space-y-2 mb-4">
            {document.clientName && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Client:</span>
                <span className="font-medium">{document.clientName}</span>
              </div>
            )}
            {document.projectName && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Project:</span>
                <span className="font-medium">{document.projectName}</span>
              </div>
            )}
          </div>
        )}
        {document.description && (
          <CardDescription className="mb-4 line-clamp-2">
            {document.description}
          </CardDescription>
        )}
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
          <span>{formatDate(document.createdAt)}</span>
          {document.updatedAt && document.updatedAt !== document.createdAt && (
            <span className="text-xs">Updated: {formatDate(document.updatedAt)}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
