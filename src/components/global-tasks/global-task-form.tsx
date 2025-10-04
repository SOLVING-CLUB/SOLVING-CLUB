"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { CalendarIcon, X, Plus, Tag, Folder } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { 
  GlobalTask, 
  GlobalTaskCategory, 
  GlobalTaskTag, 
  CreateGlobalTaskData 
} from "@/lib/types/global-tasks";
import { createGlobalTaskCategory, createGlobalTaskTag } from "@/lib/api/global-tasks";

interface GlobalTaskFormProps {
  task?: GlobalTask;
  categories: GlobalTaskCategory[];
  tags: GlobalTaskTag[];
  onSubmit: (data: CreateGlobalTaskData) => Promise<void>;
  onCancel: () => void;
}

export function GlobalTaskForm({ task, categories, tags, onSubmit, onCancel }: GlobalTaskFormProps) {
  const [formData, setFormData] = useState<CreateGlobalTaskData>({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    category_id: task?.category_id || '',
    assigned_to: task?.assigned_to || '',
    due_date: task?.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : '',
    start_date: task?.start_date ? format(new Date(task.start_date), 'yyyy-MM-dd') : '',
    estimated_hours: task?.estimated_hours || undefined,
    is_recurring: task?.is_recurring || false,
    recurring_pattern: task?.recurring_pattern || 'weekly',
    recurring_interval: task?.recurring_interval || 1,
    parent_task_id: task?.parent_task_id || '',
    project_id: task?.project_id || '',
    project_task_id: task?.project_task_id || '',
    tag_ids: task?.tags?.map(t => t.id) || [],
  });

  const [loading, setLoading] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', color: '#3B82F6', icon: 'folder' });
  const [newTag, setNewTag] = useState({ name: '', color: '#6B7280' });
  const [tagSearchOpen, setTagSearchOpen] = useState(false);
  const [categorySearchOpen, setCategorySearchOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }

    if (formData.estimated_hours && (formData.estimated_hours < 0 || formData.estimated_hours > 999)) {
      newErrors.estimated_hours = 'Estimated hours must be between 0 and 999';
    }

    if (formData.start_date && formData.due_date) {
      const startDate = new Date(formData.start_date);
      const dueDate = new Date(formData.due_date);
      if (startDate > dueDate) {
        newErrors.due_date = 'Due date must be after start date';
      }
    }

    if (formData.is_recurring && (!formData.recurring_pattern || !formData.recurring_interval)) {
      newErrors.recurring = 'Recurring pattern and interval are required for recurring tasks';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ submit: 'Failed to save task. Please try again.' });
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) return;

    try {
      const { data, error } = await createGlobalTaskCategory(newCategory);
      if (error) throw error;
      
      setFormData(prev => ({ ...prev, category_id: data?.id || '' }));
      setNewCategory({ name: '', description: '', color: '#3B82F6', icon: 'folder' });
      setShowCategoryDialog(false);
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleCreateTag = async () => {
    if (!newTag.name.trim()) return;

    try {
      const { data, error } = await createGlobalTaskTag(newTag);
      if (error) throw error;
      
      setFormData(prev => ({ 
        ...prev, 
        tag_ids: [...(prev.tag_ids || []), data?.id || ''] 
      }));
      setNewTag({ name: '', color: '#6B7280' });
      setShowTagDialog(false);
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  const handleTagToggle = (tagId: string) => {
    console.log('Toggling tag:', tagId, 'Current tag_ids:', formData.tag_ids);
    setFormData(prev => ({
      ...prev,
      tag_ids: prev.tag_ids?.includes(tagId)
        ? prev.tag_ids.filter(id => id !== tagId)
        : [...(prev.tag_ids || []), tagId]
    }));
  };

  const removeTag = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tag_ids: prev.tag_ids?.filter(id => id !== tagId) || []
    }));
  };

  const selectedTags = tags.filter(tag => formData.tag_ids?.includes(tag.id));

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-bold">
            {task ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
          <DialogDescription className="text-base">
            {task ? 'Update the task details below.' : 'Fill in the details to create a new task.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* General Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 text-red-500">⚠</div>
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-muted/30 rounded-lg p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
              <p className="text-sm text-muted-foreground">Provide the essential details for your task</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, title: e.target.value }));
                    if (errors.title) {
                      setErrors(prev => ({ ...prev, title: '' }));
                    }
                  }}
                  name="task_title"
                  placeholder="Enter task title"
                  className={`mt-2 ${errors.title ? 'border-red-500 focus:border-red-500' : ''}`}
                  required
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, description: e.target.value }));
                    if (errors.description) {
                      setErrors(prev => ({ ...prev, description: '' }));
                    }
                  }}
                  name="task_description"
                  placeholder="Enter task description"
                  rows={4}
                  className={`mt-2 ${errors.description ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Priority and Status */}
          <div className="bg-muted/30 rounded-lg p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Task Settings</h3>
              <p className="text-sm text-muted-foreground">Configure priority and status for your task</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm font-medium">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>Low</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <span>Medium</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <span>High</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="urgent">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span>Urgent</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {task && (
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                  <Select
                    value={task.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="bg-muted/30 rounded-lg p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Organization</h3>
              <p className="text-sm text-muted-foreground">Categorize and tag your task for better organization</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Category</Label>
                <div className="flex items-center space-x-2">
                  <Popover open={categorySearchOpen} onOpenChange={setCategorySearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={categorySearchOpen}
                        className="flex-1 justify-between h-10"
                      >
                        {formData.category_id
                          ? (() => {
                              const selectedCategory = categories.find(c => c.id === formData.category_id);
                              return selectedCategory ? (
                                <div className="flex items-center space-x-2">
                                  <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: selectedCategory.color }}
                                  />
                                  <span>{selectedCategory.name}</span>
                                </div>
                              ) : "Select category...";
                            })()
                          : "Select category..."}
                        <Folder className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-2" align="start">
                      <div className="space-y-2">
                        <Input 
                          placeholder="Search categories..." 
                          className="mb-2"
                        />
                        {categories.length === 0 ? (
                          <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground mb-2">No category found.</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCategorySearchOpen(false);
                                setShowCategoryDialog(true);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Create new category
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {categories.map((category) => (
                              <div
                                key={category.id}
                                className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-muted"
                                onClick={() => {
                                  console.log('Clicking category:', category.id, category.name);
                                  setFormData(prev => ({ ...prev, category_id: category.id }));
                                  setCategorySearchOpen(false);
                                }}
                              >
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: category.color }}
                                />
                                <span>{category.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCategoryDialog(true)}
                    className="h-10 px-3"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tags</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Popover open={tagSearchOpen} onOpenChange={setTagSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={tagSearchOpen}
                          className="flex-1 justify-between h-10"
                        >
                          Add tags...
                          <Tag className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-2" align="start">
                        <div className="space-y-2">
                          <Input 
                            placeholder="Search tags..." 
                            className="mb-2"
                          />
                          {tags.length === 0 ? (
                            <div className="text-center py-4">
                              <p className="text-sm text-muted-foreground mb-2">No tag found.</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setTagSearchOpen(false);
                                  setShowTagDialog(true);
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Create new tag
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {tags.map((tag) => (
                                <div
                                  key={tag.id}
                                  className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-muted"
                                  onClick={() => {
                                    handleTagToggle(tag.id);
                                  }}
                                >
                                  <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: tag.color }}
                                  />
                                  <span>{tag.name}</span>
                                  {formData.tag_ids?.includes(tag.id) && (
                                    <div className="ml-auto text-xs text-muted-foreground">Selected</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTagDialog(true)}
                      className="h-10 px-3"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-muted/20 rounded-md">
                      <span className="text-xs text-muted-foreground font-medium">Selected tags:</span>
                      {selectedTags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                          className="flex items-center space-x-1 px-2 py-1"
                          style={{ 
                            backgroundColor: `${tag.color}20`, 
                            color: tag.color,
                            borderColor: tag.color
                          }}
                        >
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="text-xs">{tag.name}</span>
                          <X 
                            className="h-3 w-3 cursor-pointer hover:bg-muted-foreground/20 rounded-sm" 
                            onClick={() => removeTag(tag.id)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-muted/30 rounded-lg p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Schedule</h3>
              <p className="text-sm text-muted-foreground">Set start and due dates for your task</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="mt-2"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Due Date</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, due_date: e.target.value }));
                    if (errors.due_date) {
                      setErrors(prev => ({ ...prev, due_date: '' }));
                    }
                  }}
                  className={`mt-2 ${errors.due_date ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                {errors.due_date && (
                  <p className="text-sm text-red-500 mt-1">{errors.due_date}</p>
                )}
              </div>
            </div>
          </div>

          {/* Time Estimation and Recurring */}
          <div className="bg-muted/30 rounded-lg p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Additional Settings</h3>
              <p className="text-sm text-muted-foreground">Configure time estimation and recurring options</p>
            </div>
            
            <div className="space-y-6">
              {/* Time Estimation */}
              <div className="space-y-2">
                <Label htmlFor="estimated_hours" className="text-sm font-medium">Estimated Hours</Label>
                <Input
                  id="estimated_hours"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.estimated_hours || ''}
                  onChange={(e) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      estimated_hours: e.target.value ? parseFloat(e.target.value) : undefined 
                    }));
                    if (errors.estimated_hours) {
                      setErrors(prev => ({ ...prev, estimated_hours: '' }));
                    }
                  }}
                  placeholder="Enter estimated hours"
                  className={`mt-2 ${errors.estimated_hours ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                {errors.estimated_hours && (
                  <p className="text-sm text-red-500 mt-1">{errors.estimated_hours}</p>
                )}
              </div>

              {/* Recurring Task */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="is_recurring"
                    checked={formData.is_recurring}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_recurring: !!checked }))}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="is_recurring" className="text-sm font-medium">Recurring Task</Label>
                    <p className="text-xs text-muted-foreground">Enable to make this task repeat automatically</p>
                  </div>
                </div>

                {formData.is_recurring && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-muted">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Pattern</Label>
                      <Select
                        value={formData.recurring_pattern}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, recurring_pattern: value as any }))}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Interval</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.recurring_interval}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          recurring_interval: parseInt(e.target.value) || 1 
                        }))}
                        className="mt-2"
                        placeholder="1"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6 border-t">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="w-full sm:w-auto"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !formData.title.trim()}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  task ? 'Update Task' : 'Create Task'
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>

        {/* Create Category Dialog */}
        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Create New Category</DialogTitle>
              <DialogDescription>
                Add a new category to organize your tasks
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="category_name" className="text-sm font-medium">Name *</Label>
                <Input
                  id="category_name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter category name"
                  className="mt-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category_description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="category_description"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter category description"
                  rows={3}
                  className="mt-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category_color" className="text-sm font-medium">Color</Label>
                <div className="flex items-center space-x-3 mt-2">
                  <Input
                    id="category_color"
                    type="color"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-10 p-1 border rounded"
                  />
                  <div className="flex-1">
                    <Input
                      value={newCategory.color}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="#3B82F6"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="pt-4 border-t">
              <div className="flex gap-3 w-full">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCategoryDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateCategory} 
                  disabled={!newCategory.name.trim()}
                  className="flex-1"
                >
                  Create Category
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Tag Dialog */}
        <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Create New Tag</DialogTitle>
              <DialogDescription>
                Add a new tag to label your tasks
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="tag_name" className="text-sm font-medium">Name *</Label>
                <Input
                  id="tag_name"
                  value={newTag.name}
                  onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter tag name"
                  className="mt-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tag_color" className="text-sm font-medium">Color</Label>
                <div className="flex items-center space-x-3 mt-2">
                  <Input
                    id="tag_color"
                    type="color"
                    value={newTag.color}
                    onChange={(e) => setNewTag(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-10 p-1 border rounded"
                  />
                  <div className="flex-1">
                    <Input
                      value={newTag.color}
                      onChange={(e) => setNewTag(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="#6B7280"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="pt-4 border-t">
              <div className="flex gap-3 w-full">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowTagDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateTag} 
                  disabled={!newTag.name.trim()}
                  className="flex-1"
                >
                  Create Tag
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
