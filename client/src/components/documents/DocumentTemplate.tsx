import { DocumentFormData } from "@/lib/types/documentForm";

interface DocumentTemplateProps {
  data: DocumentFormData;
}

/**
 * Document Template Component
 * Renders the document in a printable format
 */
export function DocumentTemplate({ data }: DocumentTemplateProps) {
  const formatCurrency = (amount: number) => {
    const currency = data.currency || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'quotation':
        return 'QUOTATION';
      case 'invoice':
        return 'INVOICE';
      case 'contract':
        return 'CONTRACT';
      case 'proposal':
        return 'PROPOSAL';
      default:
        return 'DOCUMENT';
    }
  };

  return (
    <div className="bg-white text-black p-8 max-w-4xl mx-auto" id="document-content">
      {/* Header */}
      <div className="border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Solving Club</h1>
            <p className="text-sm text-gray-600">Software Agency</p>
            <p className="text-sm text-gray-600">Hyderabad, Telangana</p>
            <p className="text-sm text-gray-600">Contactus@solvingclub.org</p>
            <p className="text-sm text-gray-600">6304725752</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold mb-2">{getDocumentTypeLabel(data.type)}</h2>
            {data.documentNumber && (
              <p className="text-sm text-gray-600">Document #: {data.documentNumber}</p>
            )}
            <p className="text-sm text-gray-600">Date: {formatDate(data.issueDate)}</p>
            {data.dueDate && (
              <p className="text-sm text-gray-600">Due Date: {formatDate(data.dueDate)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold">{data.title}</h3>
      </div>

      {/* Client Information */}
      <div className="mb-6">
        <h4 className="font-semibold mb-2">Bill To:</h4>
        <div className="text-sm">
          <p className="font-medium">{data.clientName}</p>
          {data.clientEmail && <p>{data.clientEmail}</p>}
          {data.clientPhone && <p>{data.clientPhone}</p>}
          {data.clientAddress && <p className="whitespace-pre-line">{data.clientAddress}</p>}
        </div>
      </div>

      {/* Project Information */}
      {data.projectName && (
        <div className="mb-6">
          <h4 className="font-semibold mb-2">Project:</h4>
          <p className="text-sm">{data.projectName}</p>
          {data.projectDescription && (
            <p className="text-sm text-gray-600 mt-1">{data.projectDescription}</p>
          )}
        </div>
      )}

      {/* Items Table */}
      <div className="mb-6">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
              <th className="border border-gray-300 px-4 py-2 text-center">Quantity</th>
              <th className="border border-gray-300 px-4 py-2 text-right">Unit Price</th>
              <th className="border border-gray-300 px-4 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={item.id || index}>
                <td className="border border-gray-300 px-4 py-2">{item.description || '-'}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Financial Summary */}
      <div className="mb-6 flex justify-end">
        <div className="w-64">
          <div className="flex justify-between py-2 border-b">
            <span>Subtotal:</span>
            <span>{formatCurrency(data.subtotal || 0)}</span>
          </div>
          {data.discount && data.discount > 0 && (
            <div className="flex justify-between py-2 border-b text-sm text-gray-600">
              <span>Discount:</span>
              <span>- {formatCurrency(data.discount)}</span>
            </div>
          )}
          {data.taxRate && data.taxRate > 0 && (
            <div className="flex justify-between py-2 border-b text-sm text-gray-600">
              <span>Tax ({data.taxRate}%):</span>
              <span>{formatCurrency(data.taxAmount || 0)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 font-bold text-lg border-t-2 border-gray-800 mt-2">
            <span>Total:</span>
            <span>{formatCurrency(data.total || 0)}</span>
          </div>
        </div>
      </div>

      {/* Payment Terms */}
      {data.paymentTerms && (
        <div className="mb-4">
          <h4 className="font-semibold mb-1">Payment Terms:</h4>
          <p className="text-sm">{data.paymentTerms}</p>
        </div>
      )}

      {/* Validity Period */}
      {data.validityPeriod && (
        <div className="mb-4">
          <h4 className="font-semibold mb-1">Validity Period:</h4>
          <p className="text-sm">{data.validityPeriod}</p>
        </div>
      )}

      {/* Notes */}
      {data.notes && (
        <div className="mb-4">
          <h4 className="font-semibold mb-1">Notes:</h4>
          <p className="text-sm whitespace-pre-line">{data.notes}</p>
        </div>
      )}

      {/* Terms & Conditions */}
      {data.termsAndConditions && (
        <div className="mb-4">
          <h4 className="font-semibold mb-1">Terms & Conditions:</h4>
          <p className="text-sm whitespace-pre-line">{data.termsAndConditions}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-600">
        <p>Thank you for your business!</p>
        <p className="mt-2">Solving Club - Software Agency</p>
      </div>
    </div>
  );
}
