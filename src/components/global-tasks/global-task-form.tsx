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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {task ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
          <DialogDescription>
            {task ? 'Update the task details below.' : 'Fill in the details to create a new task.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                name="task_title"
                placeholder="Enter task title"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                name="task_description"
                placeholder="Enter task description"
                rows={3}
              />
            </div>
          </div>

          {/* Priority and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {task && (
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={task.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
                >
                  <SelectTrigger>
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

          {/* Category */}
          <div>
            <Label>Category</Label>
            <div className="flex items-center space-x-2">
              <Popover open={categorySearchOpen} onOpenChange={setCategorySearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={categorySearchOpen}
                    className="flex-1 justify-between"
                  >
                    {formData.category_id
                      ? categories.find(c => c.id === formData.category_id)?.name
                      : "Select category..."}
                    <Folder className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search categories..." />
                    <CommandEmpty>No category found.</CommandEmpty>
                    <CommandGroup>
                      {categories.map((category) => (
                        <CommandItem
                          key={category.id}
                          value={category.name}
                          onSelect={() => {
                            setFormData(prev => ({ ...prev, category_id: category.id }));
                            setCategorySearchOpen(false);
                          }}
                        >
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCategoryDialog(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Popover open={tagSearchOpen} onOpenChange={setTagSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={tagSearchOpen}
                      className="flex-1 justify-between"
                    >
                      Add tags...
                      <Tag className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search tags..." />
                      <CommandEmpty>No tag found.</CommandEmpty>
                      <CommandGroup>
                        {tags.map((tag) => (
                          <CommandItem
                            key={tag.id}
                            value={tag.name}
                            onSelect={() => {
                              handleTagToggle(tag.id);
                            }}
                          >
                            <div 
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: tag.color }}
                            />
                            {tag.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTagDialog(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="flex items-center space-x-1"
                      style={{ borderColor: tag.color, color: tag.color }}
                    >
                      <span>{tag.name}</span>
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeTag(tag.id)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>
          </div>

          {/* Time Estimation */}
          <div>
            <Label htmlFor="estimated_hours">Estimated Hours</Label>
            <Input
              id="estimated_hours"
              type="number"
              step="0.5"
              min="0"
              value={formData.estimated_hours || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                estimated_hours: e.target.value ? parseFloat(e.target.value) : undefined 
              }))}
              placeholder="Enter estimated hours"
            />
          </div>

          {/* Recurring Task */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_recurring"
                checked={formData.is_recurring}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_recurring: !!checked }))}
              />
              <Label htmlFor="is_recurring">Recurring Task</Label>
            </div>

            {formData.is_recurring && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <Label>Pattern</Label>
                  <Select
                    value={formData.recurring_pattern}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, recurring_pattern: value as any }))}
                  >
                    <SelectTrigger>
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
                <div>
                  <Label>Interval</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.recurring_interval}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      recurring_interval: parseInt(e.target.value) || 1 
                    }))}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.title.trim()}>
              {loading ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
            </Button>
          </DialogFooter>
        </form>

        {/* Create Category Dialog */}
        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="category_name">Name</Label>
                <Input
                  id="category_name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <Label htmlFor="category_description">Description</Label>
                <Textarea
                  id="category_description"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter category description"
                />
              </div>
              <div>
                <Label htmlFor="category_color">Color</Label>
                <Input
                  id="category_color"
                  type="color"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCategoryDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCategory} disabled={!newCategory.name.trim()}>
                Create Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Tag Dialog */}
        <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tag_name">Name</Label>
                <Input
                  id="tag_name"
                  value={newTag.name}
                  onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter tag name"
                />
              </div>
              <div>
                <Label htmlFor="tag_color">Color</Label>
                <Input
                  id="tag_color"
                  type="color"
                  value={newTag.color}
                  onChange={(e) => setNewTag(prev => ({ ...prev, color: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowTagDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTag} disabled={!newTag.name.trim()}>
                Create Tag
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
