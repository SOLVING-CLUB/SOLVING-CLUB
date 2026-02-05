import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, FileText, Plus, Filter } from "lucide-react";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { getDocumentsByType } from "@/lib/data/documentStorage";
import { DocumentType } from "@/lib/types/documents";

export default function DocumentsPage() {
  const [, setLocation] = useLocation();
  const [selectedType, setSelectedType] = useState<DocumentType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const documentTypes: Array<{ type: DocumentType | 'all'; label: string; icon: string }> = [
    { type: 'all', label: 'All', icon: '📚' },
    { type: 'quotation', label: 'Quotations', icon: '📄' },
    { type: 'invoice', label: 'Invoices', icon: '💰' },
    { type: 'contract', label: 'Contracts', icon: '📝' },
    { type: 'proposal', label: 'Proposals', icon: '📋' },
  ];

  const filteredDocuments = useMemo(() => {
    let docs = getDocumentsByType(selectedType);
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      docs = docs.filter(doc => 
        doc.title.toLowerCase().includes(query) ||
        doc.clientName?.toLowerCase().includes(query) ||
        doc.projectName?.toLowerCase().includes(query) ||
        doc.description?.toLowerCase().includes(query)
      );
    }
    
    return docs;
  }, [selectedType, searchQuery]);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Documents & Quotations</h1>
          <p className="text-muted-foreground">
            Manage and view all your project documents, quotations, and contracts
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setLocation('/dashboard/documents/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Document
          </Button>
          <Button variant="outline" onClick={() => setLocation('/dashboard/quotations/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Quotation
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Type Tabs */}
      <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as DocumentType | 'all')}>
        <TabsList className="grid w-full grid-cols-5">
          {documentTypes.map((type) => (
            <TabsTrigger key={type.type} value={type.type} className="flex items-center gap-2">
              <span>{type.icon}</span>
              <span className="hidden sm:inline">{type.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedType} className="space-y-4 mt-6">
          {/* Documents Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {/* Documents Grid */}
          {filteredDocuments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map((document) => (
                <DocumentCard key={document.id} document={document} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Documents Found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchQuery
                    ? `No documents match your search "${searchQuery}"`
                    : `No ${selectedType === 'all' ? '' : selectedType + ' '}documents available`}
                </p>
                <Button variant="outline" onClick={() => setLocation('/dashboard/documents/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Document
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
