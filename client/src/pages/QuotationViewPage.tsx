import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, MessageSquare, PenTool } from "lucide-react";
import { QuotationPreview } from "@/components/quotations/QuotationPreview";
import { Quotation } from "@/lib/types/quotation";
import { getQuotationByShareableId } from "@/lib/data/quotationStorage";
import { toast } from "sonner";
import { generatePDF, printDocument } from "@/lib/utils/pdfGenerator";

export default function QuotationViewPage() {
  const params = useParams();
  const shareableId = params?.shareableId;
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shareableId) {
      const found = getQuotationByShareableId(shareableId);
      if (found) {
        setQuotation(found);
        // Mark as viewed if not already
        if (found.status === 'sent') {
          // In production, update status via API
        }
      } else {
        toast.error("Quotation not found");
      }
      setLoading(false);
    }
  }, [shareableId]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading quotation...</p>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Quotation Not Found</h3>
            <p className="text-muted-foreground">
              The quotation you're looking for doesn't exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Bar */}
      <div className="bg-white border-b sticky top-0 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Solving Club</h1>
            <p className="text-sm text-muted-foreground">Project Quotation</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              Add Comment
            </Button>
            {!quotation.signatures?.client && (
              <Button variant="outline" size="sm">
                <PenTool className="h-4 w-4 mr-2" />
                Sign Document
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Download className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Quotation Content */}
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="bg-gray-50 p-4 rounded-lg overflow-auto print:bg-white print:p-0 no-print">
              <div id="quotation-content">
                <QuotationPreview quotation={quotation} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
