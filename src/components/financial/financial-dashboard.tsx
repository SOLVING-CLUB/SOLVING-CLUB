"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Receipt, 
  FileText,
  Plus,
  Eye,
  Download,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { toast } from "@/lib/toast";

interface ProjectFinancials {
  projectId: string;
  projectName: string;
  totalBudget: number;
  spentAmount: number;
  remainingBudget: number;
  totalRevenue: number;
  pendingPayments: number;
  profitMargin: number;
  budgetUtilization: number;
  recentExpenses: Expense[];
  recentPayments: Payment[];
  upcomingMilestones: Milestone[];
}

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  vendor?: string;
}

interface Payment {
  id: string;
  amount: number;
  date: string;
  method: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  reference?: string;
}

interface Milestone {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'completed' | 'paid' | 'overdue';
  percentage: number;
}

interface FinancialDashboardProps {
  projectId: string;
}

export function FinancialDashboard({ projectId }: FinancialDashboardProps) {
  const [financials, setFinancials] = useState<ProjectFinancials | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancialData();
  }, [projectId]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      // TODO: Implement actual data fetching from Supabase
      // For now, using mock data
      const mockData: ProjectFinancials = {
        projectId,
        projectName: "Sample Project",
        totalBudget: 50000,
        spentAmount: 32000,
        remainingBudget: 18000,
        totalRevenue: 45000,
        pendingPayments: 5000,
        profitMargin: 28.6,
        budgetUtilization: 64,
        recentExpenses: [
          {
            id: "1",
            title: "Development Tools",
            amount: 1200,
            category: "Software",
            date: "2024-01-15",
            status: "approved",
            vendor: "Adobe"
          },
          {
            id: "2",
            title: "Server Hosting",
            amount: 800,
            category: "Infrastructure",
            date: "2024-01-10",
            status: "approved",
            vendor: "AWS"
          }
        ],
        recentPayments: [
          {
            id: "1",
            amount: 15000,
            date: "2024-01-20",
            method: "Bank Transfer",
            status: "completed",
            reference: "TXN-001"
          },
          {
            id: "2",
            amount: 10000,
            date: "2024-01-05",
            method: "Credit Card",
            status: "completed",
            reference: "TXN-002"
          }
        ],
        upcomingMilestones: [
          {
            id: "1",
            name: "Phase 1 Completion",
            amount: 15000,
            dueDate: "2024-02-15",
            status: "pending",
            percentage: 30
          },
          {
            id: "2",
            name: "Final Delivery",
            amount: 20000,
            dueDate: "2024-03-01",
            status: "pending",
            percentage: 40
          }
        ]
      };
      
      setFinancials(mockData);
    } catch (error) {
      console.error("Error loading financial data:", error);
      toast.error("Error", "Failed to load financial data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <FinancialDashboardSkeleton />;
  }

  if (!financials) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Financial Data</h3>
            <p className="text-muted-foreground mb-4">
              No financial information found for this project.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Set Up Budget
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${financials.totalBudget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {financials.budgetUtilization}% utilized
            </p>
            <Progress value={financials.budgetUtilization} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${financials.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {financials.pendingPayments > 0 && `${financials.pendingPayments.toLocaleString()} pending`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {financials.profitMargin}%
            </div>
            <p className="text-xs text-muted-foreground">
              Based on current spending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${financials.remainingBudget.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Available to spend
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Financial Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Budget Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Budget Breakdown</CardTitle>
                <CardDescription>Current budget utilization by category</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Labor</span>
                    <span>$25,000 / $30,000</span>
                  </div>
                  <Progress value={83.3} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Materials</span>
                    <span>$5,000 / $8,000</span>
                  </div>
                  <Progress value={62.5} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Software</span>
                    <span>$2,000 / $5,000</span>
                  </div>
                  <Progress value={40} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Other</span>
                    <span>$0 / $7,000</span>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest financial transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {financials.recentExpenses.slice(0, 3).map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{expense.title}</p>
                          <p className="text-xs text-muted-foreground">{expense.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">-${expense.amount.toLocaleString()}</p>
                        <Badge variant={expense.status === 'approved' ? 'default' : 'secondary'}>
                          {expense.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Project Expenses</CardTitle>
                  <CardDescription>Track and manage project expenses</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {financials.recentExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Receipt className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{expense.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {expense.category} • {expense.vendor} • {expense.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="font-medium">${expense.amount.toLocaleString()}</span>
                      <Badge variant={expense.status === 'approved' ? 'default' : 'secondary'}>
                        {expense.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Client Payments</CardTitle>
                  <CardDescription>Track payments received from clients</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {financials.recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">${payment.amount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.method} • {payment.date} • {payment.reference}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                        {payment.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment Milestones</CardTitle>
                  <CardDescription>Track project milestones and payments</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Milestone
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {financials.upcomingMilestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{milestone.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Due: {milestone.dueDate} • {milestone.percentage}% of project
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="font-medium">${milestone.amount.toLocaleString()}</span>
                      <Badge variant={
                        milestone.status === 'paid' ? 'default' : 
                        milestone.status === 'overdue' ? 'destructive' : 'secondary'
                      }>
                        {milestone.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FinancialDashboardSkeleton() {
  return (
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
  );
}
