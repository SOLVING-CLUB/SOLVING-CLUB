

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  DollarSign, 
  Calendar, 
  FileText, 
  Plus,
  Eye,
  Download,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react";
import { toast } from "@/lib/toast";
import { getSupabaseClient } from "@/lib/supabase";

interface ProjectBudget {
  id: string;
  projectId: string;
  totalBudget: number;
  currency: string;
  installments: Installment[];
  totalPaid: number;
  remainingAmount: number;
}

interface Installment {
  id: string;
  amount: number;
  dueDate: string;
  description: string;
  status: 'pending' | 'paid' | 'overdue';
}

interface ClientPayment {
  id: string;
  projectId: string;
  amount: number;
  paymentDate: string;
  installmentId?: string;
  description: string;
  proofFiles: ProofFile[];
  status: 'pending' | 'verified' | 'rejected';
}

interface ProofFile {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
}

interface ProjectFinanceManagerProps {
  projectId: string;
  projectName: string;
}

export function ProjectFinanceManager({ projectId, projectName }: ProjectFinanceManagerProps) {
  const [budget, setBudget] = useState<ProjectBudget | null>(null);
  const [payments, setPayments] = useState<ClientPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  // Budget form state
  const [budgetForm, setBudgetForm] = useState({
    totalBudget: '',
    currency: 'INR',
    installments: [] as Omit<Installment, 'id'>[]
  });

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentDate: '',
    installmentId: '',
    description: ''
  });

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  useEffect(() => {
    loadFinanceData();
  }, [projectId]);

  const loadFinanceData = async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();

      // Load project budget
      const { data: budgetData, error: budgetError } = await supabase
        .from('project_budgets')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (budgetError && budgetError.code !== 'PGRST116') {
        throw budgetError;
      }

      let budget: ProjectBudget | null = null;
      if (budgetData) {
        // Load budget installments
        const { data: installmentsData, error: installmentsError } = await supabase
          .from('budget_installments')
          .select('*')
          .eq('budget_id', budgetData.id)
          .order('due_date', { ascending: true });

        if (installmentsError) {
          throw installmentsError;
        }

        // Calculate total paid and remaining amount
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('client_payments')
          .select('amount')
          .eq('project_id', projectId)
          .eq('status', 'verified');

        if (paymentsError) {
          throw paymentsError;
        }

        const totalPaid = paymentsData?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
        const remainingAmount = Number(budgetData.total_budget) - totalPaid;

        budget = {
          id: budgetData.id,
          projectId: budgetData.project_id,
          totalBudget: Number(budgetData.total_budget),
          currency: budgetData.currency,
          installments: installmentsData?.map(installment => ({
            id: installment.id,
            amount: Number(installment.amount),
            dueDate: installment.due_date,
            description: installment.description,
            status: installment.status
          })) || [],
          totalPaid,
          remainingAmount
        };
      }

      // Load client payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('client_payments')
        .select(`
          *,
          payment_proof_files (*)
        `)
        .eq('project_id', projectId)
        .order('payment_date', { ascending: false });

      if (paymentsError) {
        throw paymentsError;
      }

      const payments: ClientPayment[] = paymentsData?.map(payment => ({
        id: payment.id,
        projectId: payment.project_id,
        amount: Number(payment.amount),
        paymentDate: payment.payment_date,
        installmentId: payment.installment_id,
        description: payment.description || '',
        status: payment.status,
        proofFiles: payment.payment_proof_files?.map((file: { id: string; file_name: string; file_path: string; file_size: number; file_type: string; uploaded_at: string }) => ({
          id: file.id,
          fileName: file.file_name,
          filePath: file.file_path,
          fileSize: file.file_size,
          fileType: file.file_type,
          uploadedAt: file.uploaded_at
        })) || []
      })) || [];

      setBudget(budget);
      setPayments(payments);
    } catch (error) {
      console.error("Error loading finance data:", error);
      toast.error("Error", "Failed to load financial data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = async () => {
    try {
      // Enhanced validation
      if (!budgetForm.totalBudget || Number(budgetForm.totalBudget) <= 0) {
        toast.error("Error", "Please enter a valid total budget amount");
        return;
      }

      if (budgetForm.installments.length === 0) {
        toast.error("Error", "Please add at least one installment");
        return;
      }

      // Validate installments
      for (let i = 0; i < budgetForm.installments.length; i++) {
        const installment = budgetForm.installments[i];
        if (!installment.amount || Number(installment.amount) <= 0) {
          toast.error("Error", `Installment ${i + 1}: Please enter a valid amount`);
          return;
        }
        if (!installment.dueDate) {
          toast.error("Error", `Installment ${i + 1}: Please select a due date`);
          return;
        }
        if (!installment.description.trim()) {
          toast.error("Error", `Installment ${i + 1}: Please enter a description`);
          return;
        }
      }

      const supabase = getSupabaseClient();
      
      // Verify Supabase client is properly initialized
      if (!supabase) {
        console.error("Supabase client is not initialized");
        toast.error("Error", "Database connection not available");
        return;
      }

      console.log("Supabase client initialized:", !!supabase);
      
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error("Auth error:", authError);
        toast.error("Error", "You must be logged in to create a budget");
        return;
      }

      console.log("User authenticated:", user.id);

      // Test database connection
      try {
        const { data: testData, error: testError } = await supabase
          .from('projects')
          .select('id')
          .limit(1);
        
        if (testError) {
          console.error("Database connection test failed:", testError);
          toast.error("Error", "Database connection failed");
          return;
        }
        
        console.log("Database connection test successful");
      } catch (testCatchError) {
        console.error("Database connection test exception:", testCatchError);
        toast.error("Error", "Database connection failed");
        return;
      }

      // Check if project exists and user has access
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, owner_id')
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        console.error("Project error:", projectError);
        toast.error("Error", "Project not found or access denied");
        return;
      }

      console.log("Project found:", project.id, "Owner:", project.owner_id);

      if (project.owner_id !== user.id) {
        toast.error("Error", "Only project owners can create budgets");
        return;
      }

      // Create project budget
      const budgetData = {
        project_id: projectId,
        total_budget: Number(budgetForm.totalBudget),
        currency: budgetForm.currency
      };

      console.log("Creating budget with data:", budgetData);

      let budgetResult, budgetError;
      
      try {
        const result = await supabase
          .from('project_budgets')
          .insert(budgetData)
          .select()
          .single();
        
        budgetResult = result.data;
        budgetError = result.error;
        
        console.log("Supabase budget response:", { data: budgetResult, error: budgetError });
      } catch (catchError) {
        console.error("Caught error during budget creation:", catchError);
        toast.error("Error", `Failed to create budget: ${catchError instanceof Error ? catchError.message : 'Network or connection error'}`);
        return;
      }

      if (budgetError) {
        console.error("Budget creation error details:", {
          error: budgetError,
          errorType: typeof budgetError,
          errorKeys: Object.keys(budgetError),
          code: budgetError?.code,
          message: budgetError?.message,
          details: budgetError?.details,
          hint: budgetError?.hint,
          fullError: JSON.stringify(budgetError, null, 2)
        });
        toast.error("Error", `Failed to create budget: ${budgetError?.message || budgetError?.code || 'Unknown error'}`);
        return;
      }

      console.log("Budget created successfully:", budgetResult);

      // Create budget installments
      const installmentsData = budgetForm.installments.map(installment => ({
        budget_id: budgetResult.id,
        amount: Number(installment.amount),
        due_date: installment.dueDate,
        description: installment.description.trim(),
        status: 'pending'
      }));

      console.log("Creating installments with data:", installmentsData);

      const { error: installmentsError } = await supabase
        .from('budget_installments')
        .insert(installmentsData);

      if (installmentsError) {
        console.error("Installments creation error details:", {
          error: installmentsError,
          code: installmentsError.code,
          message: installmentsError.message,
          details: installmentsError.details,
          hint: installmentsError.hint
        });
        toast.error("Error", `Failed to create installments: ${installmentsError.message || installmentsError.code || 'Unknown error'}`);
        return;
      }

      console.log("Installments created successfully");

      toast.success("Budget Created", "Project budget has been created successfully");
      setIsBudgetDialogOpen(false);
      setBudgetForm({
        totalBudget: '',
        currency: 'INR',
        installments: []
      });
      loadFinanceData();
    } catch (error) {
      console.error("Error creating budget:", error);
      toast.error("Error", `Failed to create project budget: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRecordPayment = async () => {
    try {
      // Enhanced validation
      if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
        toast.error("Error", "Please enter a valid payment amount");
        return;
      }

      if (!paymentForm.paymentDate) {
        toast.error("Error", "Please select a payment date");
        return;
      }

      const supabase = getSupabaseClient();
      
      // Verify Supabase client is properly initialized
      if (!supabase) {
        console.error("Supabase client is not initialized");
        toast.error("Error", "Database connection not available");
        return;
      }

      console.log("Supabase client initialized:", !!supabase);
      
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error("Auth error:", authError);
        toast.error("Error", "You must be logged in to record payments");
        return;
      }

      console.log("User authenticated:", user.id);

      // Check if project exists and user has access
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, owner_id')
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        toast.error("Error", "Project not found or access denied");
        return;
      }

      if (project.owner_id !== user.id) {
        toast.error("Error", "Only project owners can record payments");
        return;
      }

      // Create client payment
      const paymentData = {
        project_id: projectId,
        installment_id: paymentForm.installmentId || null,
        amount: Number(paymentForm.amount),
        payment_date: paymentForm.paymentDate,
        description: paymentForm.description.trim(),
        status: 'verified'
      };

      console.log("Creating payment with data:", paymentData);

      let paymentResult, paymentError;
      
      try {
        const result = await supabase
          .from('client_payments')
          .insert(paymentData)
          .select()
          .single();
        
        paymentResult = result.data;
        paymentError = result.error;
        
        console.log("Supabase response:", { data: paymentResult, error: paymentError });
      } catch (catchError) {
        console.error("Caught error during payment creation:", catchError);
        toast.error("Error", `Failed to record payment: ${catchError instanceof Error ? catchError.message : 'Network or connection error'}`);
        return;
      }

      if (paymentError) {
        console.error("Payment creation error details:", {
          error: paymentError,
          errorType: typeof paymentError,
          errorKeys: Object.keys(paymentError),
          code: paymentError?.code,
          message: paymentError?.message,
          details: paymentError?.details,
          hint: paymentError?.hint,
          fullError: JSON.stringify(paymentError, null, 2)
        });
        toast.error("Error", `Failed to record payment: ${paymentError?.message || paymentError?.code || 'Unknown error'}`);
        return;
      }

      console.log("Payment created successfully:", paymentResult);

      // Upload proof files if any
      if (uploadedFiles.length > 0) {
        console.log("Uploading files:", uploadedFiles.map(f => f.name));
        
        const fileUploadPromises = uploadedFiles.map(async (file) => {
          try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${paymentResult.id}/${Date.now()}.${fileExt}`;
            const filePath = `payment-proofs/${fileName}`;

            console.log(`Uploading file ${file.name} to ${filePath}`);

            // Upload file to Supabase Storage
            const { error: uploadError } = await supabase.storage
              .from('payment-proofs')
              .upload(filePath, file);

            if (uploadError) {
              console.error("File upload error details:", {
                error: uploadError,
                message: uploadError.message
              });
              throw new Error(`Failed to upload ${file.name}: ${uploadError.message || 'Unknown error'}`);
            }

            console.log(`File ${file.name} uploaded successfully`);

            // Save file metadata to database
            const fileMetadata = {
              payment_id: paymentResult.id,
              file_name: file.name,
              file_path: filePath,
              file_size: file.size,
              file_type: file.type
            };

            console.log("Saving file metadata:", fileMetadata);

            const { error: fileError } = await supabase
              .from('payment_proof_files')
              .insert(fileMetadata);

            if (fileError) {
              console.error("File metadata error details:", {
                error: fileError,
                code: fileError.code,
                message: fileError.message,
                details: fileError.details,
                hint: fileError.hint
              });
              throw new Error(`Failed to save file metadata for ${file.name}: ${fileError.message || fileError.code || 'Unknown error'}`);
            }

            console.log(`File metadata for ${file.name} saved successfully`);
          } catch (fileError) {
            console.error(`Error uploading file ${file.name}:`, fileError);
            throw fileError;
          }
        });

        try {
          await Promise.all(fileUploadPromises);
          console.log("All files uploaded successfully");
        } catch (fileError) {
          console.error("File upload failed:", fileError);
          toast.error("Warning", `Payment recorded but some files failed to upload: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
        }
      }

      // Update installment status if linked
      if (paymentForm.installmentId) {
        const { error: updateError } = await supabase
          .from('budget_installments')
          .update({ status: 'paid' })
          .eq('id', paymentForm.installmentId);

        if (updateError) {
          console.error("Installment update error:", updateError);
          toast.error("Warning", `Payment recorded but failed to update installment status: ${updateError.message}`);
        }
      }

      toast.success("Payment Recorded", "Client payment has been recorded successfully");
      
      if (uploadedFiles.length > 0) {
        toast.success("Files Uploaded", `${uploadedFiles.length} proof file(s) uploaded successfully`);
      }
      
      setIsPaymentDialogOpen(false);
      setPaymentForm({
        amount: '',
        paymentDate: '',
        installmentId: '',
        description: ''
      });
      setUploadedFiles([]);
      loadFinanceData();
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error("Error", `Failed to record client payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return <ProjectFinanceSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Project Budget Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Project Budget
              </CardTitle>
              <CardDescription>
                Set up project budget and payment installments
              </CardDescription>
            </div>
            <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {budget ? 'Edit Budget' : 'Set Budget'}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{budget ? 'Edit Project Budget' : 'Set Project Budget'}</DialogTitle>
                  <DialogDescription>
                    {budget ? 'Update the project budget and payment installments.' : 'Define the total project budget and payment installments.'}
                  </DialogDescription>
                </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="totalBudget">Total Budget</Label>
                        <Input
                          id="totalBudget"
                          type="number"
                          value={budgetForm.totalBudget}
                          onChange={(e) => setBudgetForm({ ...budgetForm, totalBudget: e.target.value })}
                          placeholder="50000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <select
                          id="currency"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          value={budgetForm.currency}
                          onChange={(e) => setBudgetForm({ ...budgetForm, currency: e.target.value })}
                        >
                          <option value="INR">INR</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="CAD">CAD</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Installments</Label>
                      <div className="space-y-2">
                        {budgetForm.installments.map((installment, index) => (
                          <div key={index} className="flex gap-2 p-3 border rounded-lg">
                            <div className="flex-1">
                              <Input
                                placeholder="Amount"
                                type="number"
                                value={installment.amount}
                                onChange={(e) => {
                                  const newInstallments = [...budgetForm.installments];
                                  newInstallments[index] = { ...installment, amount: Number(e.target.value) };
                                  setBudgetForm({ ...budgetForm, installments: newInstallments });
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <Input
                                placeholder="Due Date"
                                type="date"
                                value={installment.dueDate}
                                onChange={(e) => {
                                  const newInstallments = [...budgetForm.installments];
                                  newInstallments[index] = { ...installment, dueDate: e.target.value };
                                  setBudgetForm({ ...budgetForm, installments: newInstallments });
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <Input
                                placeholder="Description"
                                value={installment.description}
                                onChange={(e) => {
                                  const newInstallments = [...budgetForm.installments];
                                  newInstallments[index] = { ...installment, description: e.target.value };
                                  setBudgetForm({ ...budgetForm, installments: newInstallments });
                                }}
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newInstallments = budgetForm.installments.filter((_, i) => i !== index);
                                setBudgetForm({ ...budgetForm, installments: newInstallments });
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          onClick={() => {
                            setBudgetForm({
                              ...budgetForm,
                              installments: [...budgetForm.installments, { amount: 0, dueDate: '', description: '', status: 'pending' as const }]
                            });
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Installment
                        </Button>
                      </div>
                    </div>
                  </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsBudgetDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateBudget}>
                    {budget ? 'Update Budget' : 'Create Budget'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {!budget ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Budget Set</h3>
              <p className="text-muted-foreground mb-4">
                Set up a budget for this project to start tracking payments.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Budget Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{budget.totalBudget.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">{budget.currency}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">₹{budget.totalPaid.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Received from client</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Remaining</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">₹{budget.remainingAmount.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Outstanding amount</p>
                  </CardContent>
                </Card>
              </div>

              {/* Installments */}
              <div>
                <h4 className="font-medium mb-4">Payment Installments</h4>
                <div className="space-y-3">
                  {budget.installments.map((installment) => (
                    <div key={installment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(installment.status)}
                        <div>
                          <p className="font-medium">₹{installment.amount.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">{installment.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Due: {new Date(installment.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={getStatusVariant(installment.status)}>
                        {installment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Payments Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Client Payments
              </CardTitle>
              <CardDescription>
                Track payments received from clients with proof of payment
              </CardDescription>
            </div>
            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Record Client Payment</DialogTitle>
                  <DialogDescription>
                    Record a payment received from the client.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        placeholder="15000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentDate">Payment Date</Label>
                      <Input
                        id="paymentDate"
                        type="date"
                        value={paymentForm.paymentDate}
                        onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="installmentId">Installment</Label>
                    <select
                      id="installmentId"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={paymentForm.installmentId}
                      onChange={(e) => setPaymentForm({ ...paymentForm, installmentId: e.target.value })}
                    >
                      <option value="">Select installment</option>
                      {budget?.installments.map((installment) => (
                        <option key={installment.id} value={installment.id}>
                          {installment.description} - ₹{installment.amount.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={paymentForm.description}
                      onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                      placeholder="Payment details and notes..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Proof of Payment</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setUploadedFiles(files);
                        }}
                        className="w-full"
                      />
                      {uploadedFiles.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="text-sm text-muted-foreground">
                              {file.name} ({(file.size / 1024).toFixed(1)} KB)
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload receipts, bank statements, or screenshots (PDF, JPG, PNG, DOC)
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleRecordPayment}>
                    Record Payment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Payments Recorded</h3>
              <p className="text-muted-foreground mb-4">
                Record client payments to track project revenue.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium">₹{payment.amount.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{payment.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant={payment.status === 'verified' ? 'default' : 'secondary'}>
                      {payment.status}
                    </Badge>
                    {payment.proofFiles.length > 0 && (
                      <Badge variant="outline">
                        <FileText className="h-3 w-3 mr-1" />
                        {payment.proofFiles.length} file{payment.proofFiles.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {payment.proofFiles.length > 0 && (
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProjectFinanceSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
              <div className="h-4 w-48 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-10 w-24 bg-muted animate-pulse rounded" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="h-12 w-12 bg-muted animate-pulse rounded mx-auto mb-4" />
            <div className="h-6 w-32 bg-muted animate-pulse rounded mx-auto mb-2" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded mx-auto" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}