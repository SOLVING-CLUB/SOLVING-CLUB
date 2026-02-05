import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Eye, Download, Save, ArrowLeft, Share2 } from "lucide-react";
import { QuotationForm } from "@/components/quotations/QuotationForm";
import { QuotationPreview } from "@/components/quotations/QuotationPreview";
import { Quotation } from "@/lib/types/quotation";
import { toast } from "sonner";
import { getQuotationById, saveQuotation, updateQuotation } from "@/lib/data/quotationStorage";
import { generatePDF, printDocument } from "@/lib/utils/pdfGenerator";

export default function CreateQuotationPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const quotationId = params?.id;
  
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("form");
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (quotationId) {
      const existing = getQuotationById(quotationId);
      if (existing) {
        setQuotation(existing);
        setIsEditMode(true);
        setActiveTab("preview");
      }
    }
  }, [quotationId]);

  const handleSubmit = async (data: Partial<Quotation>) => {
    setIsGenerating(true);
    
    try {
      const agencyInfo = {
        name: 'Solving Club',
        email: 'Contactus@solvingclub.org',
        phone: '6304725752',
        address: 'Hyderabad, Telangana',
      };

      const quotationData: Partial<Quotation> = {
        ...data,
        agency: agencyInfo,
        status: 'draft',
      };

      if (isEditMode && quotationId) {
        const updated = updateQuotation(quotationId, quotationData);
        if (updated) {
          setQuotation(updated);
          toast.success("Quotation updated successfully!");
        }
      } else {
        const saved = saveQuotation(quotationData);
        setQuotation(saved);
        toast.success("Quotation generated successfully!");
      }
      
      setActiveTab("preview");
    } catch (error) {
      toast.error("Failed to generate quotation");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!quotation) return;

    try {
      if (isEditMode && quotationId) {
        const updated = updateQuotation(quotationId, { status: 'sent' });
        if (updated) {
          toast.success("Quotation saved and marked as sent!");
          setLocation('/dashboard/documents');
        }
      } else {
        const updated = updateQuotation(quotation.id, { status: 'sent' });
        if (updated) {
          toast.success("Quotation saved successfully!");
          setLocation('/dashboard/documents');
        }
      }
    } catch (error) {
      toast.error("Failed to save quotation");
    }
  };

  const handleDownloadPDF = async () => {
    if (!quotation) return;
    
    try {
      const projectName = quotation.project.name.replace(/[^a-zA-Z0-9]/g, '_');
      const dateStr = new Date(quotation.project.preparedOn).toISOString().split('T')[0];
      const filename = `Quotation_${projectName}_${dateStr}.pdf`;
      await generatePDF('quotation-content', filename);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error("Failed to generate PDF. Using print dialog instead.");
      // Fallback to print dialog
      printDocument('quotation-content');
    }
  };

  const handlePrint = () => {
    if (!quotation) return;
    printDocument('quotation-content');
  };

  const handleShare = () => {
    if (!quotation) return;
    
    const shareUrl = `${window.location.origin}/quotation/view/${quotation.shareableId}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Shareable link copied to clipboard!");
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
              {isEditMode ? 'Edit Quotation' : 'Create Quotation'}
            </h1>
            <p className="text-muted-foreground">
              Build a professional project quotation document
            </p>
          </div>
        </div>
        {quotation && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share Link
            </Button>
            <Button variant="outline" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Download className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
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
          {quotation && (
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="form" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              <QuotationForm
                onSubmit={handleSubmit}
                isLoading={isGenerating}
                initialData={quotation || undefined}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {quotation && (
          <TabsContent value="preview" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-[calc(100vh-300px)] print:bg-white print:p-0 no-print">
                  <div id="quotation-content">
                    <QuotationPreview quotation={quotation} />
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2 no-print">
                  <Button variant="outline" onClick={() => setActiveTab("form")}>
                    Edit
                  </Button>
                  <Button variant="outline" onClick={handlePrint}>
                    <Download className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button variant="outline" onClick={handleDownloadPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
