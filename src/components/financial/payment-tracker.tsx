"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  CreditCard, 
  Upload, 
  Eye,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign
} from "lucide-react";
import { toast } from "@/lib/toast";

interface Payment {
  id: string;
  projectId: string;
  clientId?: string;
  amount: number;
  currency: string;
  paymentDate: string;
  paymentMethod: 'bank_transfer' | 'credit_card' | 'paypal' | 'check' | 'cash' | 'other';
  paymentReference?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  notes?: string;
  proofFiles: ProofFile[];
  createdAt: string;
  updatedAt: string;
}

interface ProofFile {
  id: string;
  paymentId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  createdAt: string;
}

interface Client {
  id: string;
  name: string;
  email?: string;
  company?: string;
}

interface PaymentTrackerProps {
  projectId: string;
}

export function PaymentTracker({ projectId }: PaymentTrackerProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Form states
  const [paymentForm, setPaymentForm] = useState({
    clientId: '',
    amount: '',
    currency: 'USD',
    paymentDate: '',
    paymentMethod: 'bank_transfer' as 'bank_transfer' | 'credit_card' | 'paypal' | 'check' | 'cash' | 'other',
    paymentReference: '',
    status: 'pending' as 'pending' | 'completed' | 'failed' | 'refunded',
    notes: ''
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  useEffect(() => {
    loadPayments();
    loadClients();
  }, [projectId]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      // TODO: Implement actual data fetching from Supabase
      // For now, using mock data
      const mockPayments: Payment[] = [
        {
          id: '1',
          projectId,
          clientId: '1',
          amount: 15000,
          currency: 'USD',
          paymentDate: '2024-01-20',
          paymentMethod: 'bank_transfer' as 'bank_transfer' | 'credit_card' | 'paypal' | 'check' | 'cash' | 'other',
          paymentReference: 'TXN-001',
          status: 'completed',
          notes: 'First milestone payment',
          proofFiles: [
            {
              id: '1',
              paymentId: '1',
              fileName: 'bank_transfer_receipt.pdf',
              filePath: '/financial-files/payment-proofs/bank_transfer_receipt.pdf',
              fileSize: 245760,
              fileType: 'application/pdf',
              uploadedBy: 'user1',
              createdAt: '2024-01-20T10:30:00Z'
            }
          ],
          createdAt: '2024-01-20T10:00:00Z',
          updatedAt: '2024-01-20T10:00:00Z'
        },
        {
          id: '2',
          projectId,
          clientId: '1',
          amount: 10000,
          currency: 'USD',
          paymentDate: '2024-01-05',
          paymentMethod: 'credit_card',
          paymentReference: 'TXN-002',
          status: 'completed',
          notes: 'Initial payment',
          proofFiles: [],
          createdAt: '2024-01-05T09:15:00Z',
          updatedAt: '2024-01-05T09:15:00Z'
        },
        {
          id: '3',
          projectId,
          clientId: '2',
          amount: 5000,
          currency: 'USD',
          paymentDate: '2024-02-01',
          paymentMethod: 'paypal',
          paymentReference: 'TXN-003',
          status: 'pending' as 'pending' | 'completed' | 'failed' | 'refunded',
          notes: 'Pending verification',
          proofFiles: [],
          createdAt: '2024-02-01T14:20:00Z',
          updatedAt: '2024-02-01T14:20:00Z'
        }
      ];
      
      setPayments(mockPayments);
    } catch (error) {
      console.error("Error loading payments:", error);
      toast.error("Error", "Failed to load payment data");
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      // TODO: Implement actual client fetching from Supabase
      const mockClients: Client[] = [
        { id: '1', name: 'Acme Corp', email: 'contact@acme.com', company: 'Acme Corporation' },
        { id: '2', name: 'Tech Solutions', email: 'billing@techsolutions.com', company: 'Tech Solutions Inc.' }
      ];
      setClients(mockClients);
    } catch (error) {
      console.error("Error loading clients:", error);
    }
  };

  const handleCreatePayment = async () => {
    try {
      // TODO: Implement actual payment creation with file upload
      toast.success("Payment Recorded", "Payment has been recorded successfully");
      setIsCreateDialogOpen(false);
      setPaymentForm({
        clientId: '',
        amount: '',
        currency: 'USD',
        paymentDate: '',
        paymentMethod: 'bank_transfer' as 'bank_transfer' | 'credit_card' | 'paypal' | 'check' | 'cash' | 'other',
        paymentReference: '',
        status: 'pending' as 'pending' | 'completed' | 'failed' | 'refunded',
        notes: ''
      });
      setUploadedFiles([]);
      loadPayments();
    } catch (error) {
      console.error("Error creating payment:", error);
      toast.error("Error", "Failed to create payment record");
    }
  };

  const handleUpdatePayment = async () => {
    try {
      // TODO: Implement actual payment update
      toast.success("Payment Updated", "Payment has been updated successfully");
      setIsEditDialogOpen(false);
      setEditingPayment(null);
      setPaymentForm({
        clientId: '',
        amount: '',
        currency: 'USD',
        paymentDate: '',
        paymentMethod: 'bank_transfer' as 'bank_transfer' | 'credit_card' | 'paypal' | 'check' | 'cash' | 'other',
        paymentReference: '',
        status: 'pending' as 'pending' | 'completed' | 'failed' | 'refunded',
        notes: ''
      });
      setUploadedFiles([]);
      loadPayments();
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Error", "Failed to update payment");
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    try {
      // TODO: Implement actual payment deletion
      toast.success("Payment Deleted", "Payment has been deleted successfully");
      loadPayments();
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("Error", "Failed to delete payment");
    }
  };

  const openEditDialog = (payment: Payment) => {
    setEditingPayment(payment);
    setPaymentForm({
      clientId: payment.clientId || '',
      amount: payment.amount.toString(),
      currency: payment.currency,
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod,
      paymentReference: payment.paymentReference || '',
      status: payment.status,
      notes: payment.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsViewDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'refunded':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'refunded':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getTotalRevenue = () => {
    return payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const getPendingAmount = () => {
    return payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);
  };

  if (loading) {
    return <PaymentTrackerSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${getTotalRevenue().toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              From completed payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${getPendingAmount().toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {payments.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Payment records
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Records</CardTitle>
              <CardDescription>Track all client payments and proof of payment</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Record New Payment</DialogTitle>
                  <DialogDescription>
                    Record a payment received from a client with proof of payment.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="clientId" className="text-right">
                      Client
                    </Label>
                    <Select value={paymentForm.clientId} onValueChange={(value) => setPaymentForm({ ...paymentForm, clientId: value })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name} {client.company && `(${client.company})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">
                      Amount
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      className="col-span-3"
                      placeholder="15000"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="currency" className="text-right">
                      Currency
                    </Label>
                    <Select value={paymentForm.currency} onValueChange={(value) => setPaymentForm({ ...paymentForm, currency: value })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="paymentDate" className="text-right">
                      Payment Date
                    </Label>
                    <Input
                      id="paymentDate"
                      type="date"
                      value={paymentForm.paymentDate}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="paymentMethod" className="text-right">
                      Method
                    </Label>
                    <Select value={paymentForm.paymentMethod} onValueChange={(value: 'bank_transfer' | 'credit_card' | 'paypal' | 'check' | 'cash' | 'other') => setPaymentForm({ ...paymentForm, paymentMethod: value })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="paymentReference" className="text-right">
                      Reference
                    </Label>
                    <Input
                      id="paymentReference"
                      value={paymentForm.paymentReference}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentReference: e.target.value })}
                      className="col-span-3"
                      placeholder="TXN-001"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right">
                      Status
                    </Label>
                    <Select value={paymentForm.status} onValueChange={(value: 'pending' | 'completed' | 'failed' | 'refunded') => setPaymentForm({ ...paymentForm, status: value })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="notes" className="text-right">
                      Notes
                    </Label>
                    <Textarea
                      id="notes"
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                      className="col-span-3"
                      placeholder="Additional notes about this payment"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">
                      Proof of Payment
                    </Label>
                    <div className="col-span-3">
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          if (e.target.files) {
                            setUploadedFiles(Array.from(e.target.files));
                          }
                        }}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload receipts, screenshots, or bank statements (PDF, JPG, PNG)
                      </p>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePayment}>
                    Record Payment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(payment.status)}
                  <div>
                    <p className="font-medium">${payment.amount.toLocaleString()} {payment.currency}</p>
                    <p className="text-sm text-muted-foreground">
                      {payment.paymentMethod.replace('_', ' ')} • {payment.paymentDate}
                      {payment.paymentReference && ` • ${payment.paymentReference}`}
                    </p>
                    {payment.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{payment.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant={getStatusVariant(payment.status)}>
                    {payment.status}
                  </Badge>
                  {payment.proofFiles.length > 0 && (
                    <Badge variant="outline">
                      <Upload className="h-3 w-3 mr-1" />
                      {payment.proofFiles.length} file{payment.proofFiles.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => openViewDialog(payment)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(payment)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeletePayment(payment.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* View Payment Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              View payment information and proof of payment files.
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <p className="text-lg font-semibold">${selectedPayment.amount.toLocaleString()} {selectedPayment.currency}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedPayment.status)}
                    <Badge variant={getStatusVariant(selectedPayment.status)}>
                      {selectedPayment.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment Method</Label>
                  <p className="capitalize">{selectedPayment.paymentMethod.replace('_', ' ')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment Date</Label>
                  <p>{selectedPayment.paymentDate}</p>
                </div>
                {selectedPayment.paymentReference && (
                  <div>
                    <Label className="text-sm font-medium">Reference</Label>
                    <p>{selectedPayment.paymentReference}</p>
                  </div>
                )}
              </div>
              {selectedPayment.notes && (
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <p className="text-sm text-muted-foreground">{selectedPayment.notes}</p>
                </div>
              )}
              {selectedPayment.proofFiles.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Proof of Payment Files</Label>
                  <div className="space-y-2 mt-2">
                    {selectedPayment.proofFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-2">
                          <Upload className="h-4 w-4" />
                          <span className="text-sm">{file.fileName}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.fileSize / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
            <DialogDescription>
              Update payment information and proof of payment files.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Similar form fields as create dialog */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editAmount" className="text-right">
                Amount
              </Label>
              <Input
                id="editAmount"
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                className="col-span-3"
                placeholder="15000"
              />
            </div>
            {/* Add other form fields here */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePayment}>
              Update Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PaymentTrackerSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
              <div className="h-4 w-48 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-10 w-32 bg-muted animate-pulse rounded" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                  <div className="flex space-x-1">
                    <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                    <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                    <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
