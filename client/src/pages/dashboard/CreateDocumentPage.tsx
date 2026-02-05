import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Eye, Download, Save, ArrowLeft } from "lucide-react";
import { DocumentForm } from "@/components/documents/DocumentForm";
import { DocumentTemplate } from "@/components/documents/DocumentTemplate";
import { DocumentFormData } from "@/lib/types/documentForm";
import { toast } from "sonner";
import { getDocumentById, saveDocument, updateDocument } from "@/lib/data/documentStorage";

export default function CreateDocumentPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const documentId = params?.id;
  const searchParams = new URLSearchParams(window.location.search);
  const viewMode = searchParams.get('view');
  
  const [formData, setFormData] = useState<DocumentFormData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("form");
  const [isEditMode, setIsEditMode] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);

  useEffect(() => {
    if (documentId) {
      // Edit mode
      const existingDoc = getDocumentById(documentId);
      if (existingDoc?.formData) {
        setFormData(existingDoc.formData);
        setIsEditMode(true);
      }
    } else if (viewMode) {
      // View mode
      const existingDoc = getDocumentById(viewMode);
      if (existingDoc?.formData) {
        setFormData(existingDoc.formData);
        setIsViewMode(true);
        setActiveTab("preview");
      }
    }
  }, [documentId, viewMode]);

  const handleSubmit = async (data: DocumentFormData) => {
    setIsGenerating(true);
    
    // Generate document number if not provided
    if (!data.documentNumber) {
      const prefix = data.type.toUpperCase().substring(0, 3);
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
      data.documentNumber = `${prefix}-${date}-${Math.floor(Math.random() * 1000)}`;
    }

    setFormData(data);
    setActiveTab("preview");
    setIsGenerating(false);
    toast.success("Document generated successfully!");
  };

  const handleDownloadPDF = () => {
    if (!formData) return;

    // Use window.print() to print the current page
    // The user can save as PDF from the print dialog
    window.print();
  };

  const handleSave = async () => {
    if (!formData) return;

    try {
      if (isEditMode && documentId) {
        // Update existing document
        const updated = updateDocument(documentId, formData);
        if (updated) {
          toast.success("Document updated successfully!");
          setLocation('/dashboard/documents');
        } else {
          toast.error("Failed to update document");
        }
      } else {
        // Save new document
        const saved = saveDocument(formData);
        toast.success("Document saved successfully!");
        setLocation('/dashboard/documents');
      }
    } catch (error) {
      toast.error("Failed to save document");
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/dashboard/documents')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {isEditMode ? 'Edit Document' : isViewMode ? 'View Document' : 'Create Document'}
            </h1>
            <p className="text-muted-foreground">
              {isViewMode 
                ? 'View your generated document'
                : 'Fill in the details below to generate a professional document'}
            </p>
          </div>
        </div>
        {formData && (
          <div className="flex gap-2">
            {!isViewMode && (
              <Button variant="outline" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                {isEditMode ? 'Update' : 'Save'} Document
              </Button>
            )}
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Print / Save PDF
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="form" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Form
          </TabsTrigger>
          {formData && (
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="form" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <DocumentForm
                onSubmit={handleSubmit}
                isLoading={isGenerating}
                initialData={formData || undefined}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {formData && (
          <TabsContent value="preview" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-[calc(100vh-300px)] print:bg-white print:p-0">
                  <DocumentTemplate data={formData} />
                </div>
                <div className="mt-4 flex justify-end gap-2 print:hidden">
                  {!isViewMode && (
                    <Button variant="outline" onClick={() => setActiveTab("form")}>
                      Edit
                    </Button>
                  )}
                  <Button onClick={handleDownloadPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    Print / Save PDF
                  </Button>
                  {!isViewMode && (
                    <Button onClick={handleSave}>
                      <Save className="h-4 w-4 mr-2" />
                      {isEditMode ? 'Update' : 'Save'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
