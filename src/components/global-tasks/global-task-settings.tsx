"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  User, 
  Bell, 
  Palette, 
  Database,
  Trash2,
  Plus,
  X
} from "lucide-react";
import { toast } from "@/lib/toast";
import type { 
  UserTaskPreferences, 
  GlobalTaskCategory, 
  GlobalTaskTag 
} from "@/lib/types/global-tasks";
import {
  updateUserTaskPreferences,
  updateGlobalTaskCategory,
  deleteGlobalTaskCategory,
  updateGlobalTaskTag,
  deleteGlobalTaskTag
} from "@/lib/api/global-tasks";

interface GlobalTaskSettingsProps {
  preferences: UserTaskPreferences | null;
  categories: GlobalTaskCategory[];
  tags: GlobalTaskTag[];
  onPreferencesUpdate: (preferences: UserTaskPreferences) => void;
  onCancel: () => void;
}

export function GlobalTaskSettings({ 
  preferences, 
  categories, 
  tags, 
  onPreferencesUpdate, 
  onCancel 
}: GlobalTaskSettingsProps) {
  const [activeTab, setActiveTab] = useState('preferences');
  const [loading, setLoading] = useState(false);
  
  // Preferences state
  type PrefsState = {
    default_view: 'kanban' | 'list' | 'calendar' | 'gantt';
    default_priority: 'low' | 'medium' | 'high' | 'urgent';
    default_category_id: string;
    auto_archive_completed: boolean;
    show_completed_tasks: boolean;
    time_tracking_enabled: boolean;
    notifications_enabled: boolean;
    email_notifications: boolean;
  };

  const [prefs, setPrefs] = useState<PrefsState>({
    default_view: (preferences?.default_view ?? 'kanban') as PrefsState['default_view'],
    default_priority: (preferences?.default_priority ?? 'medium') as PrefsState['default_priority'],
    default_category_id: preferences?.default_category_id ?? '',
    auto_archive_completed: !!(preferences?.auto_archive_completed ?? true),
    show_completed_tasks: !!(preferences?.show_completed_tasks ?? false),
    time_tracking_enabled: !!(preferences?.time_tracking_enabled ?? true),
    notifications_enabled: !!(preferences?.notifications_enabled ?? true),
    email_notifications: !!(preferences?.email_notifications ?? false),
  });

  // Categories state
  const [editingCategory, setEditingCategory] = useState<GlobalTaskCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: 'folder'
  });

  // Tags state
  const [editingTag, setEditingTag] = useState<GlobalTaskTag | null>(null);
  const [tagForm, setTagForm] = useState({
    name: '',
    color: '#6B7280'
  });

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      const { data, error } = await updateUserTaskPreferences(prefs);
      if (error) throw error;
      
      if (data) {
        onPreferencesUpdate(data);
        toast.success('Preferences updated successfully');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!editingCategory) return;
    
    setLoading(true);
    try {
      const { data, error } = await updateGlobalTaskCategory(editingCategory.id, categoryForm);
      if (error) throw error;
      
      toast.success('Category updated successfully');
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', color: '#3B82F6', icon: 'folder' });
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) return;
    
    setLoading(true);
    try {
      const { error } = await deleteGlobalTaskCategory(categoryId);
      if (error) throw error;
      
      toast.success('Category deleted successfully');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTag = async () => {
    if (!editingTag) return;
    
    setLoading(true);
    try {
      const { data, error } = await updateGlobalTaskTag(editingTag.id, tagForm);
      if (error) throw error;
      
      toast.success('Tag updated successfully');
      setEditingTag(null);
      setTagForm({ name: '', color: '#6B7280' });
    } catch (error) {
      console.error('Error updating tag:', error);
      toast.error('Failed to update tag');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag? This action cannot be undone.')) return;
    
    setLoading(true);
    try {
      const { error } = await deleteGlobalTaskTag(tagId);
      if (error) throw error;
      
      toast.success('Tag deleted successfully');
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error('Failed to delete tag');
    } finally {
      setLoading(false);
    }
  };

  const startEditingCategory = (category: GlobalTaskCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      color: category.color,
      icon: category.icon
    });
  };

  const startEditingTag = (tag: GlobalTaskTag) => {
    setEditingTag(tag);
    setTagForm({
      name: tag.name,
      color: tag.color
    });
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Task Management Settings
          </DialogTitle>
          <DialogDescription>
            Customize your task management experience and manage your categories and tags.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
          </TabsList>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <div className="space-y-6">
              {/* General Settings */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  General Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="default_view">Default View</Label>
                    <Select
                      value={prefs.default_view}
                      onValueChange={(value) => setPrefs(prev => ({ ...prev, default_view: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kanban">Kanban Board</SelectItem>
                        <SelectItem value="list">List View</SelectItem>
                        <SelectItem value="calendar">Calendar View</SelectItem>
                        <SelectItem value="gantt">Gantt Chart</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="default_priority">Default Priority</Label>
                    <Select
                      value={prefs.default_priority}
                      onValueChange={(value) => setPrefs(prev => ({ ...prev, default_priority: value as any }))}
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

                  <div>
                    <Label htmlFor="default_category">Default Category</Label>
                    <Select
                      value={prefs.default_category_id}
                      onValueChange={(value) => setPrefs(prev => ({ ...prev, default_category_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select default category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No default category</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Display Settings */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  Display Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="auto_archive_completed"
                      checked={prefs.auto_archive_completed}
                      onCheckedChange={(checked) => setPrefs(prev => ({ ...prev, auto_archive_completed: !!checked }))}
                    />
                    <Label htmlFor="auto_archive_completed">Auto-archive completed tasks</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show_completed_tasks"
                      checked={prefs.show_completed_tasks}
                      onCheckedChange={(checked) => setPrefs(prev => ({ ...prev, show_completed_tasks: !!checked }))}
                    />
                    <Label htmlFor="show_completed_tasks">Show completed tasks by default</Label>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notification Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="notifications_enabled"
                      checked={prefs.notifications_enabled}
                      onCheckedChange={(checked) => setPrefs(prev => ({ ...prev, notifications_enabled: !!checked }))}
                    />
                    <Label htmlFor="notifications_enabled">Enable in-app notifications</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="email_notifications"
                      checked={prefs.email_notifications}
                      onCheckedChange={(checked) => setPrefs(prev => ({ ...prev, email_notifications: !!checked }))}
                    />
                    <Label htmlFor="email_notifications">Enable email notifications</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="time_tracking_enabled"
                      checked={prefs.time_tracking_enabled}
                      onCheckedChange={(checked) => setPrefs(prev => ({ ...prev, time_tracking_enabled: !!checked }))}
                    />
                    <Label htmlFor="time_tracking_enabled">Enable time tracking</Label>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Manage Categories
              </h3>
              <div className="space-y-3">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <div>
                        <div className="font-medium">{category.name}</div>
                        {category.description && (
                          <div className="text-sm text-gray-600">{category.description}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditingCategory(category)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Tags Tab */}
          <TabsContent value="tags" className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Manage Tags
              </h3>
              <div className="space-y-3">
                {tags.map((tag) => (
                  <div key={tag.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <div className="font-medium">{tag.name}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditingTag(tag)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTag(tag.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSavePreferences} disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogFooter>

        {/* Edit Category Dialog */}
        {editingCategory && (
          <Dialog open={true} onOpenChange={() => setEditingCategory(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category_name">Name</Label>
                  <Input
                    id="category_name"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="category_description">Description</Label>
                  <Textarea
                    id="category_description"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="category_color">Color</Label>
                  <Input
                    id="category_color"
                    type="color"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingCategory(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveCategory} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Category'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Tag Dialog */}
        {editingTag && (
          <Dialog open={true} onOpenChange={() => setEditingTag(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Tag</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tag_name">Name</Label>
                  <Input
                    id="tag_name"
                    value={tagForm.name}
                    onChange={(e) => setTagForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="tag_color">Color</Label>
                  <Input
                    id="tag_color"
                    type="color"
                    value={tagForm.color}
                    onChange={(e) => setTagForm(prev => ({ ...prev, color: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingTag(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveTag} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Tag'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
