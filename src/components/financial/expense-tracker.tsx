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
  Receipt, 
  Upload, 
  Eye,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Filter
} from "lucide-react";
import { toast } from "@/lib/toast";

interface Expense {
  id: string;
  projectId: string;
  budgetCategoryId?: string;
  userId: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  expenseDate: string;
  category: 'labor' | 'materials' | 'software' | 'travel' | 'other';
  vendor?: string;
  receiptUrl?: string;
  isBillable: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

interface BudgetCategory {
  id: string;
  categoryName: string;
  allocatedAmount: number;
  spentAmount: number;
}

interface ExpenseTrackerProps {
  projectId: string;
}

export function ExpenseTracker({ projectId }: ExpenseTrackerProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form states
  const [expenseForm, setExpenseForm] = useState({
    budgetCategoryId: '',
    title: '',
    description: '',
    amount: '',
    currency: 'INR',
    expenseDate: '',
    category: 'other' as 'labor' | 'materials' | 'software' | 'travel' | 'other',
    vendor: '',
    isBillable: true,
    status: 'pending' as 'pending' | 'approved' | 'rejected'
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  useEffect(() => {
    loadExpenses();
    loadBudgetCategories();
  }, [projectId]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      // TODO: Implement actual data fetching from Supabase
      // For now, using mock data
      const mockExpenses: Expense[] = [
        {
          id: '1',
          projectId,
          budgetCategoryId: '1',
          userId: 'user1',
          title: 'Development Tools License',
          description: 'Annual license for development software',
          amount: 1200,
          currency: 'INR',
          expenseDate: '2024-01-15',
          category: 'software',
          vendor: 'Adobe',
          receiptUrl: '/financial-files/receipts/adobe_license.pdf',
          isBillable: true,
          status: 'approved',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          projectId,
          budgetCategoryId: '2',
          userId: 'user1',
          title: 'Server Hosting',
          description: 'Monthly AWS hosting costs',
          amount: 800,
          currency: 'INR',
          expenseDate: '2024-01-10',
          category: 'materials',
          vendor: 'Amazon Web Services',
          receiptUrl: '/financial-files/receipts/aws_invoice.pdf',
          isBillable: true,
          status: 'approved',
          createdAt: '2024-01-10T09:00:00Z',
          updatedAt: '2024-01-10T09:00:00Z'
        },
        {
          id: '3',
          projectId,
          budgetCategoryId: '1',
          userId: 'user2',
          title: 'Team Lunch',
          description: 'Client meeting lunch',
          amount: 150,
          currency: 'INR',
          expenseDate: '2024-01-20',
          category: 'other' as 'labor' | 'materials' | 'software' | 'travel' | 'other',
          vendor: 'Restaurant ABC',
          isBillable: true,
          status: 'pending' as 'pending' | 'approved' | 'rejected',
          createdAt: '2024-01-20T14:00:00Z',
          updatedAt: '2024-01-20T14:00:00Z'
        },
        {
          id: '4',
          projectId,
          budgetCategoryId: '3',
          userId: 'user1',
          title: 'Design Software',
          description: 'Figma Pro subscription',
          amount: 300,
          currency: 'INR',
          expenseDate: '2024-01-05',
          category: 'software',
          vendor: 'Figma',
          isBillable: true,
          status: 'approved',
          createdAt: '2024-01-05T11:00:00Z',
          updatedAt: '2024-01-05T11:00:00Z'
        }
      ];
      
      setExpenses(mockExpenses);
    } catch (error) {
      console.error("Error loading expenses:", error);
      toast.error("Error", "Failed to load expense data");
    } finally {
      setLoading(false);
    }
  };

  const loadBudgetCategories = async () => {
    try {
      // TODO: Implement actual budget category fetching from Supabase
      const mockCategories: BudgetCategory[] = [
        { id: '1', categoryName: 'Labor', allocatedAmount: 30000, spentAmount: 25000 },
        { id: '2', categoryName: 'Materials', allocatedAmount: 8000, spentAmount: 5000 },
        { id: '3', categoryName: 'Software', allocatedAmount: 5000, spentAmount: 2000 },
        { id: '4', categoryName: 'Other', allocatedAmount: 7000, spentAmount: 150 }
      ];
      setBudgetCategories(mockCategories);
    } catch (error) {
      console.error("Error loading budget categories:", error);
    }
  };

  const handleCreateExpense = async () => {
    try {
      // TODO: Implement actual expense creation with file upload
      toast.success("Expense Recorded", "Expense has been recorded successfully");
      setIsCreateDialogOpen(false);
      setExpenseForm({
        budgetCategoryId: '',
        title: '',
        description: '',
        amount: '',
        currency: 'INR',
        expenseDate: '',
        category: 'other' as 'labor' | 'materials' | 'software' | 'travel' | 'other',
        vendor: '',
        isBillable: true,
        status: 'pending' as 'pending' | 'approved' | 'rejected'
      });
      setUploadedFiles([]);
      loadExpenses();
    } catch (error) {
      console.error("Error creating expense:", error);
      toast.error("Error", "Failed to create expense record");
    }
  };

  const handleUpdateExpense = async () => {
    try {
      // TODO: Implement actual expense update
      toast.success("Expense Updated", "Expense has been updated successfully");
      setIsEditDialogOpen(false);
      setEditingExpense(null);
      setExpenseForm({
        budgetCategoryId: '',
        title: '',
        description: '',
        amount: '',
        currency: 'INR',
        expenseDate: '',
        category: 'other' as 'labor' | 'materials' | 'software' | 'travel' | 'other',
        vendor: '',
        isBillable: true,
        status: 'pending' as 'pending' | 'approved' | 'rejected'
      });
      setUploadedFiles([]);
      loadExpenses();
    } catch (error) {
      console.error("Error updating expense:", error);
      toast.error("Error", "Failed to update expense");
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      // TODO: Implement actual expense deletion
      toast.success("Expense Deleted", "Expense has been deleted successfully");
      loadExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Error", "Failed to delete expense");
    }
  };

  const openEditDialog = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      budgetCategoryId: expense.budgetCategoryId || '',
      title: expense.title,
      description: expense.description || '',
      amount: expense.amount.toString(),
      currency: expense.currency,
      expenseDate: expense.expenseDate,
      category: expense.category as 'labor' | 'materials' | 'software' | 'travel' | 'other',
      vendor: expense.vendor || '',
      isBillable: expense.isBillable,
      status: expense.status
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsViewDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'labor':
        return <TrendingUp className="h-4 w-4" />;
      case 'materials':
        return <Receipt className="h-4 w-4" />;
      case 'software':
        return <DollarSign className="h-4 w-4" />;
      case 'travel':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Receipt className="h-4 w-4" />;
    }
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getApprovedExpenses = () => {
    return expenses
      .filter(expense => expense.status === 'approved')
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getPendingExpenses = () => {
    return expenses
      .filter(expense => expense.status === 'pending')
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getFilteredExpenses = () => {
    return expenses.filter(expense => {
      const categoryMatch = filterCategory === 'all' || expense.category === filterCategory;
      const statusMatch = filterStatus === 'all' || expense.status === filterStatus;
      return categoryMatch && statusMatch;
    });
  };

  if (loading) {
    return <ExpenseTrackerSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Expense Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ₹{getTotalExpenses().toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              All recorded expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Expenses</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{getApprovedExpenses().toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Approved for reimbursement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Expenses</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ₹{getPendingExpenses().toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expense List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Expense Records</CardTitle>
              <CardDescription>Track and manage project expenses</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add New Expense</DialogTitle>
                  <DialogDescription>
                    Record a new project expense with receipt upload.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">
                      Title
                    </Label>
                    <Input
                      id="title"
                      value={expenseForm.title}
                      onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                      className="col-span-3"
                      placeholder="Development Tools License"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">
                      Amount
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      className="col-span-3"
                      placeholder="1200"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="currency" className="text-right">
                      Currency
                    </Label>
                    <Select value={expenseForm.currency} onValueChange={(value) => setExpenseForm({ ...expenseForm, currency: value })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="expenseDate" className="text-right">
                      Date
                    </Label>
                    <Input
                      id="expenseDate"
                      type="date"
                      value={expenseForm.expenseDate}
                      onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">
                      Category
                    </Label>
                    <Select value={expenseForm.category} onValueChange={(value: 'labor' | 'materials' | 'software' | 'travel' | 'other') => setExpenseForm({ ...expenseForm, category: value })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="labor">Labor</SelectItem>
                        <SelectItem value="materials">Materials</SelectItem>
                        <SelectItem value="software">Software</SelectItem>
                        <SelectItem value="travel">Travel</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="budgetCategoryId" className="text-right">
                      Budget Category
                    </Label>
                    <Select value={expenseForm.budgetCategoryId} onValueChange={(value) => setExpenseForm({ ...expenseForm, budgetCategoryId: value })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select budget category" />
                      </SelectTrigger>
                      <SelectContent>
                        {budgetCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.categoryName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="vendor" className="text-right">
                      Vendor
                    </Label>
                    <Input
                      id="vendor"
                      value={expenseForm.vendor}
                      onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
                      className="col-span-3"
                      placeholder="Adobe"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                      className="col-span-3"
                      placeholder="Annual license for development software"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">
                      Receipt
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
                        Upload receipt or invoice (PDF, JPG, PNG)
                      </p>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateExpense}>
                    Add Expense
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="labor">Labor</SelectItem>
                  <SelectItem value="materials">Materials</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {getFilteredExpenses().map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getCategoryIcon(expense.category)}
                  <div>
                    <p className="font-medium">{expense.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {expense.category} • {expense.vendor} • {expense.expenseDate}
                    </p>
                    {expense.description && (
                      <p className="text-xs text-muted-foreground mt-1">{expense.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-medium">₹{expense.amount.toLocaleString()}</p>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(expense.status)}
                      <Badge variant={getStatusVariant(expense.status)}>
                        {expense.status}
                      </Badge>
                    </div>
                  </div>
                  {expense.receiptUrl && (
                    <Badge variant="outline">
                      <Upload className="h-3 w-3 mr-1" />
                      Receipt
                    </Badge>
                  )}
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => openViewDialog(expense)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(expense)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteExpense(expense.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* View Expense Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
            <DialogDescription>
              View expense information and receipt files.
            </DialogDescription>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <p className="text-lg font-semibold">₹{selectedExpense.amount.toLocaleString()} {selectedExpense.currency}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedExpense.status)}
                    <Badge variant={getStatusVariant(selectedExpense.status)}>
                      {selectedExpense.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <p className="capitalize">{selectedExpense.category}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p>{selectedExpense.expenseDate}</p>
                </div>
                {selectedExpense.vendor && (
                  <div>
                    <Label className="text-sm font-medium">Vendor</Label>
                    <p>{selectedExpense.vendor}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">Billable</Label>
                  <p>{selectedExpense.isBillable ? 'Yes' : 'No'}</p>
                </div>
              </div>
              {selectedExpense.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground">{selectedExpense.description}</p>
                </div>
              )}
              {selectedExpense.receiptUrl && (
                <div>
                  <Label className="text-sm font-medium">Receipt</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Receipt className="h-4 w-4" />
                    <span className="text-sm">Receipt uploaded</span>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
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
    </div>
  );
}

function ExpenseTrackerSkeleton() {
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
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-48 bg-muted animate-pulse rounded" />
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right space-y-2">
                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                    <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                  </div>
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
