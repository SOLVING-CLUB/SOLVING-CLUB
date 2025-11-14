

import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialDashboard } from "@/components/financial/financial-dashboard";
import { BudgetManager } from "@/components/financial/budget-manager";
import { PaymentTracker } from "@/components/financial/payment-tracker";
import { ExpenseTracker } from "@/components/financial/expense-tracker";
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Receipt,
  FileText,
  BarChart3,
  Settings
} from "lucide-react";

export default function FinancialPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <FinancialPageSkeleton />;
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Financial Management</h1>
        <p className="text-muted-foreground">
          Manage project budgets, track expenses, and monitor client payments
        </p>
      </div>

      {/* Financial Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Budget</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center space-x-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Expenses</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Reports</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <FinancialDashboard projectId={projectId} />
        </TabsContent>

        <TabsContent value="budget" className="space-y-6">
          <BudgetManager projectId={projectId} />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <PaymentTracker projectId={projectId} />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <ExpenseTracker projectId={projectId} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <FinancialReports projectId={projectId} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <FinancialSettings projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Financial Reports Component
function FinancialReports({ projectId }: { projectId: string }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Financial Reports</CardTitle>
          <CardDescription>
            Generate and download financial reports for this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Budget Summary</CardTitle>
                <CardDescription>Overview of budget allocation and spending</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">$50,000</div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Expense Report</CardTitle>
                <CardDescription>Detailed breakdown of all expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">$32,000</div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Payment Summary</CardTitle>
                <CardDescription>Client payments and outstanding amounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">$45,000</div>
                <p className="text-sm text-muted-foreground">Revenue Received</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Profit & Loss</CardTitle>
                <CardDescription>Project profitability analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">$13,000</div>
                <p className="text-sm text-muted-foreground">Net Profit</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Cash Flow</CardTitle>
                <CardDescription>Monthly cash flow analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-600">$8,500</div>
                <p className="text-sm text-muted-foreground">Monthly Average</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Tax Report</CardTitle>
                <CardDescription>Tax-deductible expenses and income</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">$28,000</div>
                <p className="text-sm text-muted-foreground">Deductible Expenses</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Financial Settings Component
function FinancialSettings({ projectId }: { projectId: string }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Financial Settings</CardTitle>
          <CardDescription>
            Configure financial preferences and default values
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Default Currency</h3>
              <p className="text-sm text-muted-foreground">
                Set the default currency for this project
              </p>
              <select className="w-full p-2 border rounded-md">
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
              </select>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tax Rate</h3>
              <p className="text-sm text-muted-foreground">
                Default tax rate for invoices and expenses
              </p>
              <input
                type="number"
                placeholder="0.00"
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Invoice Numbering</h3>
              <p className="text-sm text-muted-foreground">
                Format for automatic invoice numbering
              </p>
              <input
                type="text"
                placeholder="INV-{YYYY}-{MM}-{###}"
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Payment Terms</h3>
              <p className="text-sm text-muted-foreground">
                Default payment terms for invoices
              </p>
              <select className="w-full p-2 border rounded-md">
                <option value="net15">Net 15 days</option>
                <option value="net30">Net 30 days</option>
                <option value="net45">Net 45 days</option>
                <option value="net60">Net 60 days</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input type="checkbox" defaultChecked />
                <span className="text-sm">Email notifications for new payments</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" defaultChecked />
                <span className="text-sm">Email notifications for expense approvals</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" />
                <span className="text-sm">Email notifications for budget alerts</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" defaultChecked />
                <span className="text-sm">Weekly financial summary reports</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Loading Skeleton
function FinancialPageSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
      </div>
      
      <div className="space-y-6">
        <div className="h-10 w-full bg-muted animate-pulse rounded" />
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-24 bg-muted animate-pulse rounded mb-2" />
                  <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
