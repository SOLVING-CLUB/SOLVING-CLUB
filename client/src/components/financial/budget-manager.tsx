

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { toast } from "@/lib/toast";

interface Budget {
  id: string;
  projectId: string;
  totalBudget: number;
  currency: string;
  budgetType: 'fixed' | 'hourly' | 'milestone';
  hourlyRate?: number;
  estimatedHours?: number;
  contingencyPercentage: number;
  categories: BudgetCategory[];
  createdAt: string;
  updatedAt: string;
}

interface BudgetCategory {
  id: string;
  budgetId: string;
  categoryName: string;
  allocatedAmount: number;
  spentAmount: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface BudgetManagerProps {
  projectId: string;
}

export function BudgetManager({ projectId }: BudgetManagerProps) {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);

  // Form states
  const [budgetForm, setBudgetForm] = useState({
    totalBudget: '',
    currency: 'INR',
    budgetType: 'fixed' as 'fixed' | 'hourly' | 'milestone',
    hourlyRate: '',
    estimatedHours: '',
    contingencyPercentage: '10'
  });

  const [categoryForm, setCategoryForm] = useState({
    categoryName: '',
    allocatedAmount: '',
    description: ''
  });

  useEffect(() => {
    loadBudget();
  }, [projectId]);

  const loadBudget = async () => {
    try {
      setLoading(true);
      // TODO: Implement actual data fetching from Supabase
      // For now, using mock data
      const mockBudget: Budget = {
        id: '1',
        projectId,
        totalBudget: 50000,
        currency: 'INR',
        budgetType: 'fixed',
        contingencyPercentage: 10,
        categories: [
          {
            id: '1',
            budgetId: '1',
            categoryName: 'Labor',
            allocatedAmount: 30000,
            spentAmount: 25000,
            description: 'Development team costs',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01'
          },
          {
            id: '2',
            budgetId: '1',
            categoryName: 'Materials',
            allocatedAmount: 8000,
            spentAmount: 5000,
            description: 'Hardware and software licenses',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01'
          },
          {
            id: '3',
            budgetId: '1',
            categoryName: 'Software',
            allocatedAmount: 5000,
            spentAmount: 2000,
            description: 'Third-party software and tools',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01'
          },
          {
            id: '4',
            budgetId: '1',
            categoryName: 'Other',
            allocatedAmount: 7000,
            spentAmount: 0,
            description: 'Miscellaneous expenses',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01'
          }
        ],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };
      
      setBudget(mockBudget);
    } catch (error) {
      console.error("Error loading budget:", error);
      toast.error("Error", "Failed to load budget data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = async () => {
    try {
      // TODO: Implement actual budget creation
      toast.success("Budget Created", "Project budget has been set up successfully");
      setIsCreateDialogOpen(false);
      loadBudget();
    } catch (error) {
      console.error("Error creating budget:", error);
      toast.error("Error", "Failed to create budget");
    }
  };

  const handleCreateCategory = async () => {
    try {
      // TODO: Implement actual category creation
      toast.success("Category Added", "Budget category has been added successfully");
      setIsCategoryDialogOpen(false);
      setCategoryForm({ categoryName: '', allocatedAmount: '', description: '' });
      loadBudget();
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Error", "Failed to create category");
    }
  };

  const handleUpdateCategory = async () => {
    try {
      // TODO: Implement actual category update
      toast.success("Category Updated", "Budget category has been updated successfully");
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      setCategoryForm({ categoryName: '', allocatedAmount: '', description: '' });
      loadBudget();
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Error", "Failed to update category");
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      // TODO: Implement actual category deletion
      toast.success("Category Deleted", "Budget category has been deleted successfully");
      loadBudget();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Error", "Failed to delete category");
    }
  };

  const openCategoryDialog = (category?: BudgetCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        categoryName: category.categoryName,
        allocatedAmount: category.allocatedAmount.toString(),
        description: category.description || ''
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ categoryName: '', allocatedAmount: '', description: '' });
    }
    setIsCategoryDialogOpen(true);
  };

  const getTotalAllocated = () => {
    return budget?.categories.reduce((sum, cat) => sum + cat.allocatedAmount, 0) || 0;
  };

  const getTotalSpent = () => {
    return budget?.categories.reduce((sum, cat) => sum + cat.spentAmount, 0) || 0;
  };

  const getBudgetUtilization = () => {
    const total = getTotalAllocated();
    const spent = getTotalSpent();
    return total > 0 ? (spent / total) * 100 : 0;
  };

  const getCategoryUtilization = (category: BudgetCategory) => {
    return category.allocatedAmount > 0 ? (category.spentAmount / category.allocatedAmount) * 100 : 0;
  };

  if (loading) {
    return <BudgetManagerSkeleton />;
  }

  if (!budget) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Budget Set</h3>
            <p className="text-muted-foreground mb-4">
              Set up a budget to start tracking project finances.
            </p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Budget
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create Project Budget</DialogTitle>
                  <DialogDescription>
                    Set up a budget for this project to track expenses and revenue.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="totalBudget" className="text-right">
                      Total Budget
                    </Label>
                    <Input
                      id="totalBudget"
                      type="number"
                      value={budgetForm.totalBudget}
                      onChange={(e) => setBudgetForm({ ...budgetForm, totalBudget: e.target.value })}
                      className="col-span-3"
                      placeholder="50000"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="currency" className="text-right">
                      Currency
                    </Label>
                    <Select value={budgetForm.currency} onValueChange={(value) => setBudgetForm({ ...budgetForm, currency: value })}>
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
                    <Label htmlFor="budgetType" className="text-right">
                      Budget Type
                    </Label>
                    <Select value={budgetForm.budgetType} onValueChange={(value: 'fixed' | 'hourly' | 'milestone') => setBudgetForm({ ...budgetForm, budgetType: value })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Price</SelectItem>
                        <SelectItem value="hourly">Hourly Rate</SelectItem>
                        <SelectItem value="milestone">Milestone Based</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {budgetForm.budgetType === 'hourly' && (
                    <>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="hourlyRate" className="text-right">
                          Hourly Rate
                        </Label>
                        <Input
                          id="hourlyRate"
                          type="number"
                          value={budgetForm.hourlyRate}
                          onChange={(e) => setBudgetForm({ ...budgetForm, hourlyRate: e.target.value })}
                          className="col-span-3"
                          placeholder="100"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="estimatedHours" className="text-right">
                          Est. Hours
                        </Label>
                        <Input
                          id="estimatedHours"
                          type="number"
                          value={budgetForm.estimatedHours}
                          onChange={(e) => setBudgetForm({ ...budgetForm, estimatedHours: e.target.value })}
                          className="col-span-3"
                          placeholder="500"
                        />
                      </div>
                    </>
                  )}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="contingency" className="text-right">
                      Contingency %
                    </Label>
                    <Input
                      id="contingency"
                      type="number"
                      value={budgetForm.contingencyPercentage}
                      onChange={(e) => setBudgetForm({ ...budgetForm, contingencyPercentage: e.target.value })}
                      className="col-span-3"
                      placeholder="10"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateBudget}>
                    Create Budget
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Budget Overview</CardTitle>
              <CardDescription>
                Total budget: ₹{budget.totalBudget.toLocaleString()} {budget.currency}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={getBudgetUtilization() > 80 ? 'destructive' : getBudgetUtilization() > 60 ? 'default' : 'secondary'}>
                {getBudgetUtilization().toFixed(1)}% utilized
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">₹{getTotalAllocated().toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Allocated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">₹{getTotalSpent().toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Spent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">₹{(getTotalAllocated() - getTotalSpent()).toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Remaining</div>
              </div>
            </div>
            <Progress value={getBudgetUtilization()} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Budget Categories */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Budget Categories</CardTitle>
              <CardDescription>Manage budget allocation by category</CardDescription>
            </div>
            <Button onClick={() => openCategoryDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budget.categories.map((category) => {
              const utilization = getCategoryUtilization(category);
              return (
                <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{category.categoryName}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant={utilization > 80 ? 'destructive' : utilization > 60 ? 'default' : 'secondary'}>
                          {utilization.toFixed(1)}%
                        </Badge>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => openCategoryDialog(category)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Allocated: ₹{category.allocatedAmount.toLocaleString()}</span>
                        <span>Spent: ₹{category.spentAmount.toLocaleString()}</span>
                      </div>
                      <Progress value={utilization} className="h-2" />
                      {category.description && (
                        <p className="text-xs text-muted-foreground mt-1">{category.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Update the budget category details.' : 'Add a new budget category.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categoryName" className="text-right">
                Name
              </Label>
              <Input
                id="categoryName"
                value={categoryForm.categoryName}
                onChange={(e) => setCategoryForm({ ...categoryForm, categoryName: e.target.value })}
                className="col-span-3"
                placeholder="Labor"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="allocatedAmount" className="text-right">
                Amount
              </Label>
              <Input
                id="allocatedAmount"
                type="number"
                value={categoryForm.allocatedAmount}
                onChange={(e) => setCategoryForm({ ...categoryForm, allocatedAmount: e.target.value })}
                className="col-span-3"
                placeholder="30000"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                className="col-span-3"
                placeholder="Development team costs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}>
              {editingCategory ? 'Update' : 'Create'} Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BudgetManagerSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
              <div className="h-4 w-48 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-6 w-20 bg-muted animate-pulse rounded" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="text-center space-y-2">
                  <div className="h-8 w-24 bg-muted animate-pulse rounded mx-auto" />
                  <div className="h-4 w-20 bg-muted animate-pulse rounded mx-auto" />
                </div>
              ))}
            </div>
            <div className="h-2 w-full bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
