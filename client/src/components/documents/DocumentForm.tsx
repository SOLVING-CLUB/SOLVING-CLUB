import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Calculator } from "lucide-react";
import { DocumentFormData, DocumentItem } from "@/lib/types/documentForm";

const documentFormSchema = z.object({
  type: z.enum(['quotation', 'invoice', 'contract', 'proposal']),
  title: z.string().min(1, "Title is required"),
  documentNumber: z.string().optional(),
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email().optional().or(z.literal("")),
  clientPhone: z.string().optional(),
  clientAddress: z.string().optional(),
  projectName: z.string().min(1, "Project name is required"),
  projectDescription: z.string().optional(),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().optional(),
  paymentTerms: z.string().optional(),
  validityPeriod: z.string().optional(),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  discount: z.number().min(0).optional(),
  currency: z.string().optional(),
});

interface DocumentFormProps {
  onSubmit: (data: DocumentFormData) => void;
  initialData?: Partial<DocumentFormData>;
  isLoading?: boolean;
}

export function DocumentForm({ onSubmit, initialData, isLoading }: DocumentFormProps) {
  const [items, setItems] = useState<DocumentItem[]>(
    initialData?.items || [
      { id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 }
    ]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<DocumentFormData>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      type: initialData?.type || 'quotation',
      title: initialData?.title || '',
      documentNumber: initialData?.documentNumber || '',
      clientName: initialData?.clientName || '',
      clientEmail: initialData?.clientEmail || '',
      clientPhone: initialData?.clientPhone || '',
      clientAddress: initialData?.clientAddress || '',
      projectName: initialData?.projectName || '',
      projectDescription: initialData?.projectDescription || '',
      issueDate: initialData?.issueDate || new Date().toISOString().split('T')[0],
      dueDate: initialData?.dueDate || '',
      paymentTerms: initialData?.paymentTerms || '',
      validityPeriod: initialData?.validityPeriod || '',
      notes: initialData?.notes || '',
      termsAndConditions: initialData?.termsAndConditions || '',
      taxRate: initialData?.taxRate || 0,
      discount: initialData?.discount || 0,
      currency: initialData?.currency || 'USD',
    },
  });

  const documentType = watch('type');
  const taxRate = watch('taxRate') || 0;
  const discount = watch('discount') || 0;

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, total: 0 }
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof DocumentItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = updated.quantity * updated.unitPrice;
        }
        return updated;
      }
      return item;
    }));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = (subtotal * discount) / 100;
    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxAmount = (subtotalAfterDiscount * taxRate) / 100;
    const total = subtotalAfterDiscount + taxAmount;

    return { subtotal, discountAmount, taxAmount, total };
  };

  const onFormSubmit = (data: DocumentFormData) => {
    const totals = calculateTotals();
    onSubmit({
      ...data,
      items,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      total: totals.total,
      discount: totals.discountAmount,
    });
  };

  const totals = calculateTotals();

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Document Type & Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Document Information</CardTitle>
          <CardDescription>Basic details about the document</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Document Type *</Label>
              <Select
                value={documentType}
                onValueChange={(value) => setValue('type', value as DocumentFormData['type'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quotation">Quotation</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="e.g., Project Quotation - Job Portal Mobile App"
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentNumber">Document Number</Label>
              <Input
                id="documentNumber"
                {...register('documentNumber')}
                placeholder="Auto-generated if left empty"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issueDate">Issue Date *</Label>
              <Input
                id="issueDate"
                type="date"
                {...register('issueDate')}
              />
              {errors.issueDate && (
                <p className="text-sm text-destructive">{errors.issueDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                {...register('dueDate')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
          <CardDescription>Details about the client</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                {...register('clientName')}
                placeholder="e.g., Absolve IT and HR Private Limited"
              />
              {errors.clientName && (
                <p className="text-sm text-destructive">{errors.clientName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientEmail">Client Email</Label>
              <Input
                id="clientEmail"
                type="email"
                {...register('clientEmail')}
                placeholder="client@example.com"
              />
              {errors.clientEmail && (
                <p className="text-sm text-destructive">{errors.clientEmail.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientPhone">Client Phone</Label>
              <Input
                id="clientPhone"
                {...register('clientPhone')}
                placeholder="+1 234 567 8900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientAddress">Client Address</Label>
              <Textarea
                id="clientAddress"
                {...register('clientAddress')}
                placeholder="Street, City, State, ZIP"
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Information */}
      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
          <CardDescription>Details about the project</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name *</Label>
            <Input
              id="projectName"
              {...register('projectName')}
              placeholder="e.g., Job Portal Mobile Application"
            />
            {errors.projectName && (
              <p className="text-sm text-destructive">{errors.projectName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectDescription">Project Description</Label>
            <Textarea
              id="projectDescription"
              {...register('projectDescription')}
              placeholder="Brief description of the project..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Items/Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Items / Services</span>
            <Button type="button" onClick={addItem} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardTitle>
          <CardDescription>List of items or services included</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                <div className="col-span-12 md:col-span-5">
                  <Label className="text-xs">Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    placeholder="Item description"
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <Label className="text-xs">Quantity</Label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <Label className="text-xs">Unit Price</Label>
                  <Input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <Label className="text-xs">Total</Label>
                  <Input
                    value={`${item.total.toFixed(2)}`}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    size="icon"
                    variant="ghost"
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={watch('currency') || 'USD'}
                onValueChange={(value) => setValue('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                {...register('taxRate', { valueAsNumber: true })}
                min="0"
                max="100"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount">Discount (%)</Label>
              <Input
                id="discount"
                type="number"
                {...register('discount', { valueAsNumber: true })}
                min="0"
                max="100"
                step="0.01"
              />
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span className="font-medium">{watch('currency') || 'USD'} {totals.subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Discount ({discount}%):</span>
                <span>- {watch('currency') || 'USD'} {totals.discountAmount.toFixed(2)}</span>
              </div>
            )}
            {taxRate > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Tax ({taxRate}%):</span>
                <span>{watch('currency') || 'USD'} {totals.taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total:</span>
              <span>{watch('currency') || 'USD'} {totals.total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
          <CardDescription>Terms, notes, and other details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Input
                id="paymentTerms"
                {...register('paymentTerms')}
                placeholder="e.g., Net 30 days"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="validityPeriod">Validity Period</Label>
              <Input
                id="validityPeriod"
                {...register('validityPeriod')}
                placeholder="e.g., 30 days from issue date"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes or comments..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="termsAndConditions">Terms & Conditions</Label>
            <Textarea
              id="termsAndConditions"
              {...register('termsAndConditions')}
              placeholder="Terms and conditions for this document..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate Document'}
        </Button>
      </div>
    </form>
  );
}
