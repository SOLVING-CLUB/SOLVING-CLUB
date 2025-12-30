import { useState, useEffect, useMemo } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Edit,
  Trash2,
  X,
  Calendar,
  User,
  Tag,
  Flag,
  Clock,
  Target,
  CheckCircle2,
  Circle,
  PlayCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  ProjectTask,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilters,
  TaskSort,
  TaskGroupBy,
  TaskStatus,
  TaskPriority,
} from '@/lib/types/project-tasks';
import {
  getProjectTasks,
  createProjectTask,
  updateProjectTask,
  deleteProjectTask,
  getProjectTaskMetadata,
} from '@/lib/api/project-tasks';
import {
  getCustomProperties,
  createCustomProperty,
  updateCustomProperty,
  deleteCustomProperty,
  setCustomPropertyValue,
} from '@/lib/api/custom-properties';
import type { CustomProperty } from '@/lib/types/project-tasks';

interface ProjectTaskTrackerProps {
  projectId: string;
  members: Array<{
    id: string;
    user_id: string;
    user: {
      full_name?: string;
      avatar_url?: string;
    };
  }>;
}

export function ProjectTaskTracker({ projectId, members }: ProjectTaskTrackerProps) {
  const supabase = getSupabaseClient();
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TaskFilters>({});
  const [sort, setSort] = useState<TaskSort>({ field: 'task_number', direction: 'asc' });
  const [groupBy, setGroupBy] = useState<TaskGroupBy>('none');
  const [metadata, setMetadata] = useState<{
    tags: string[];
    labels: string[];
    teams: string[];
  }>({ tags: [], labels: [], teams: [] });
  const [customProperties, setCustomProperties] = useState<CustomProperty[]>([]);
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Custom column management
  const [isCustomColumnDialogOpen, setIsCustomColumnDialogOpen] = useState(false);
  const [editingCustomProperty, setEditingCustomProperty] = useState<CustomProperty | null>(null);
  const [newCustomProperty, setNewCustomProperty] = useState<{
    property_name: string;
    property_type: 'text' | 'number' | 'date' | 'dropdown' | 'tags' | 'boolean' | 'url';
    property_options?: string[];
    is_required: boolean;
  }>({
    property_name: '',
    property_type: 'text',
    property_options: [],
    is_required: false,
  });
  const [propertyOptionsText, setPropertyOptionsText] = useState<string>('');

  // Form states
  const [newTask, setNewTask] = useState<CreateTaskInput>({
    project_id: projectId,
    title: '',
    description: '',
    status: 'todo',
    priority: 'P2', // Default to P2 (medium priority)
  });

  // Load tasks
  useEffect(() => {
    loadTasks();
    loadMetadata();
    loadCustomProperties();
  }, [projectId, filters, sort, groupBy, searchQuery]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!isCreateDialogOpen) {
      setNewTask({
        project_id: projectId,
        title: '',
        description: '',
        status: 'todo',
        priority: 'P2',
      });
      setFormErrors({});
    }
  }, [isCreateDialogOpen, projectId]);

  useEffect(() => {
    if (!isEditDialogOpen) {
      setEditingTask(null);
      setFormErrors({});
    }
  }, [isEditDialogOpen]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`project-tasks-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_tasks',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          loadTasks();
          loadMetadata();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const taskFilters: TaskFilters = {
        ...filters,
        search: searchQuery || undefined,
      };
      const data = await getProjectTasks(projectId, taskFilters, sort, groupBy);
      setTasks(data);
    } catch (error: any) {
      console.error('Error loading tasks', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      const data = await getProjectTaskMetadata(projectId);
      setMetadata(data);
    } catch (error) {
      console.error('Error loading metadata', error);
    }
  };

  const loadCustomProperties = async () => {
    try {
      const data = await getCustomProperties(projectId);
      setCustomProperties(data);
    } catch (error) {
      console.error('Error loading custom properties', error);
    }
  };

  const handleCreateCustomProperty = async () => {
    if (!newCustomProperty.property_name.trim()) {
      toast.error('Property name is required');
      return;
    }

    try {
      const maxOrder = customProperties.length > 0 
        ? Math.max(...customProperties.map(p => p.display_order)) 
        : 0;
      
      // Process options text into array
      const options = propertyOptionsText
        .split('\n')
        .map((o) => o.trim())
        .filter((o) => o.length > 0);
      
      await createCustomProperty(projectId, {
        ...newCustomProperty,
        property_options: (newCustomProperty.property_type === 'dropdown' || newCustomProperty.property_type === 'tags') ? options : undefined,
        display_order: maxOrder + 1,
      });
      toast.success('Custom column created successfully');
      setNewCustomProperty({
        property_name: '',
        property_type: 'text',
        property_options: [],
        is_required: false,
      });
      setPropertyOptionsText('');
      setIsCustomColumnDialogOpen(false);
      loadCustomProperties();
    } catch (error: any) {
      console.error('Error creating custom property', error);
      toast.error(error?.message || 'Failed to create custom column');
    }
  };

  const handleDeleteCustomProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this custom column? This will remove all values for this column.')) {
      return;
    }

    try {
      await deleteCustomProperty(propertyId);
      toast.success('Custom column deleted successfully');
      loadCustomProperties();
    } catch (error: any) {
      console.error('Error deleting custom property', error);
      toast.error(error?.message || 'Failed to delete custom column');
    }
  };

  const handleUpdateCustomPropertyValue = async (
    taskId: string,
    propertyId: string,
    value: any,
    propertyType: string
  ) => {
    try {
      await setCustomPropertyValue(taskId, propertyId, value, propertyType);
      loadTasks();
    } catch (error: any) {
      console.error('Error updating custom property value', error);
      toast.error('Failed to update value');
    }
  };

  const renderCustomPropertyCell = (taskId: string, prop: CustomProperty, value: any) => {
    switch (prop.property_type) {
      case 'text':
        return (
          <Input
            type="text"
            defaultValue={value || ''}
            key={`${taskId}-${prop.id}-${value || ''}`} // Force re-render when value changes
            onBlur={(e) => {
              const newValue = e.target.value.trim();
              handleUpdateCustomPropertyValue(taskId, prop.id, newValue || null, 'text');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            placeholder="Enter text..."
            className="w-[150px]"
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            defaultValue={value || ''}
            key={`${taskId}-${prop.id}-${value || ''}`} // Force re-render when value changes
            onBlur={(e) => {
              const newValue = e.target.value ? parseFloat(e.target.value) : null;
              handleUpdateCustomPropertyValue(taskId, prop.id, newValue, 'number');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            placeholder="0"
            className="w-[120px]"
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={value ? new Date(value).toISOString().split('T')[0] : ''}
            onChange={(e) => {
              const newValue = e.target.value ? new Date(e.target.value).toISOString() : null;
              handleUpdateCustomPropertyValue(taskId, prop.id, newValue, 'date');
            }}
            className="w-[150px]"
          />
        );
      case 'boolean':
        return (
          <Checkbox
            checked={value || false}
            onCheckedChange={(checked) => {
              handleUpdateCustomPropertyValue(taskId, prop.id, checked, 'boolean');
            }}
          />
        );
      case 'dropdown':
        return (
          <Select
            value={value || ''}
            onValueChange={(newValue) => {
              handleUpdateCustomPropertyValue(taskId, prop.id, newValue, 'dropdown');
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {prop.property_options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'tags':
        const tags = Array.isArray(value) ? value : [];
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-[150px] justify-start">
                {tags.length > 0 ? (
                  <div className="flex gap-1 flex-wrap max-w-[120px] overflow-hidden">
                    {tags.slice(0, 2).map((tag: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {tags.length > 2 && <span className="text-xs">+{tags.length - 2}</span>}
                  </div>
                ) : (
                  <span className="text-muted-foreground">Add tags...</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px]">
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {tags.map((tag: string, idx: number) => (
                    <div
                      key={`${tag}-${idx}`}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-xs"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        className="ml-0.5 h-4 w-4 flex items-center justify-center rounded-full hover:bg-destructive/20 transition-colors focus:outline-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          const newTags = tags.filter((_, i) => i !== idx);
                          handleUpdateCustomPropertyValue(taskId, prop.id, newTags, 'tags').catch((err) => {
                            console.error('Failed to remove tag:', err);
                            toast.error('Failed to remove tag');
                          });
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        aria-label={`Remove ${tag} tag`}
                      >
                        <X className="h-3 w-3 hover:text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
                {prop.property_options && prop.property_options.length > 0 ? (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Available tags:</Label>
                      <div className="flex gap-1 flex-wrap">
                        {prop.property_options
                          .filter((opt) => !tags.includes(opt))
                          .map((option) => (
                            <Badge
                              key={option}
                              variant="outline"
                              className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                              onClick={() => {
                                handleUpdateCustomPropertyValue(taskId, prop.id, [...tags, option], 'tags');
                              }}
                            >
                              {option}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add tag..."
                      defaultValue=""
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          const newTag = e.currentTarget.value.trim();
                          if (!tags.includes(newTag)) {
                            handleUpdateCustomPropertyValue(taskId, prop.id, [...tags, newTag], 'tags');
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        );
      case 'url':
        return (
          <Input
            type="url"
            defaultValue={value || ''}
            key={`${taskId}-${prop.id}-${value || ''}`} // Force re-render when value changes
            onBlur={(e) => {
              const newValue = e.target.value.trim();
              handleUpdateCustomPropertyValue(taskId, prop.id, newValue || null, 'url');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            placeholder="https://..."
            className="w-[180px]"
          />
        );
      default:
        return <span className="text-sm text-muted-foreground">-</span>;
    }
  };

  const validateTaskForm = (task: CreateTaskInput | ProjectTask): Record<string, string> => {
    const errors: Record<string, string> = {};

    // Title validation
    if (!task.title || !task.title.trim()) {
      errors.title = 'Task title is required';
    } else if (task.title.trim().length < 3) {
      errors.title = 'Task title must be at least 3 characters';
    } else if (task.title.length > 200) {
      errors.title = 'Task title must be less than 200 characters';
    }

    // Description validation
    if (task.description && task.description.length > 2000) {
      errors.description = 'Description must be less than 2000 characters';
    }

    // Priority validation
    if (task.priority && !['P1', 'P2', 'P3', 'P4', 'P5'].includes(task.priority)) {
      errors.priority = 'Priority must be P1, P2, P3, P4, or P5';
    }



    // Supporting links validation
    if (task.supporting_links) {
      const urlPattern = /^https?:\/\/.+/;
      task.supporting_links.forEach((link, idx) => {
        if (link && !urlPattern.test(link)) {
          errors[`supporting_links_${idx}`] = 'Please enter a valid URL (starting with http:// or https://)';
        }
      });
    }

    return errors;
  };

  const handleCreateTask = async () => {
    // Validate form
    const errors = validateTaskForm(newTask);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error('Please fix the form errors');
      return;
    }

    setIsSubmitting(true);
    try {
      await createProjectTask(newTask);
      toast.success('Task created successfully');
      // Reset form
      setNewTask({
        project_id: projectId,
        title: '',
        description: '',
        status: 'todo',
        priority: 'P2',
      });
      setFormErrors({});
      setIsCreateDialogOpen(false);
      loadTasks();
      loadMetadata();
    } catch (error: any) {
      console.error('Error creating task', error);
      toast.error(error?.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: UpdateTaskInput) => {
    try {
      console.log('Updating task:', taskId, 'with updates:', updates);
      await updateProjectTask(taskId, updates);
      toast.success('Task updated successfully');
      loadTasks();
      loadMetadata();
    } catch (error: any) {
      console.error('Error updating task', error);
      const errorMessage = error?.message || error?.error?.message || 'Failed to update task';
      toast.error(errorMessage);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await deleteProjectTask(taskId);
      toast.success('Task deleted successfully');
      loadTasks();
      loadMetadata();
    } catch (error: any) {
      console.error('Error deleting task', error);
      toast.error('Failed to delete task');
    }
  };

  const handleEditTask = (task: ProjectTask) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTask) return;

    // Validate form
    const errors: Record<string, string> = {};
    if (!editingTask.title || !editingTask.title.trim()) {
      errors.title = 'Task title is required';
    } else if (editingTask.title.trim().length < 3) {
      errors.title = 'Task title must be at least 3 characters';
    } else if (editingTask.title.length > 200) {
      errors.title = 'Task title must be less than 200 characters';
    }

    if (editingTask.description && editingTask.description.length > 2000) {
      errors.description = 'Description must be less than 2000 characters';
    }



    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fix the form errors');
      return;
    }

    setFormErrors({});
    
    // Normalize priority to P1-P5 format
    let normalizedPriority: TaskPriority = 'P2'; // Default
    if (editingTask.priority_label) {
      // Use priority_label if available (P1, P2, P3, P4, P5)
      normalizedPriority = editingTask.priority_label as TaskPriority;
    } else if (editingTask.priority) {
      // Convert old format to new format
      const priorityMap: Record<string, TaskPriority> = {
        'high': 'P1',
        'medium': 'P2',
        'low': 'P3',
      };
      normalizedPriority = priorityMap[editingTask.priority] || 'P2';
    }
    
    const updates: UpdateTaskInput = {
      title: editingTask.title,
      description: editingTask.description,
      status: editingTask.status,
      priority: normalizedPriority,
      due_date: editingTask.due_date || undefined,
      assigned_to: editingTask.assigned_to || undefined,
      assigned_team: editingTask.assigned_team || undefined,
      tags: editingTask.tags,
      labels: editingTask.labels,
      supporting_links: editingTask.supporting_links,
    };

    setIsSubmitting(true);
    try {
      await handleUpdateTask(editingTask.id, updates);
      setIsEditDialogOpen(false);
      setEditingTask(null);
      setFormErrors({});
    } catch (error) {
      // Error already handled in handleUpdateTask
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group tasks
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Tasks': tasks };
    }

    const groups: Record<string, ProjectTask[]> = {};

    tasks.forEach(task => {
      let key = 'Unassigned';
      
      switch (groupBy) {
        case 'status':
          key = task.status;
          break;
        case 'priority':
          key = task.priority_label || task.priority;
          break;
        case 'assigned_team':
          key = task.assigned_team || 'No Team';
          break;
        case 'assignee':
          key = task.assigned_to ? (task.assignee?.full_name || 'Unknown') : 'Unassigned';
          break;
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(task);
    });

    return groups;
  }, [tasks, groupBy]);

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return <Circle className="h-4 w-4" />;
      case 'in-progress':
        return <PlayCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };

  const getPriorityColor = (priority: TaskPriority | string) => {
    const priorityLabel = typeof priority === 'string' && priority.startsWith('P') ? priority : `P${priority}`;
    switch (priorityLabel) {
      case 'P1':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'P2':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'P3':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'P4':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'P5':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {(filters.status?.length || filters.priority?.length || filters.assigned_to?.length || filters.assigned_team?.length) && (
                  <Badge variant="secondary" className="ml-2">
                    {[filters.status?.length, filters.priority?.length, filters.assigned_to?.length, filters.assigned_team?.length]
                      .filter(Boolean)
                      .reduce((a, b) => (a || 0) + (b || 0), 0)}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Status</Label>
                  <div className="space-y-2">
                    {(['todo', 'in-progress', 'completed'] as TaskStatus[]).map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`filter-status-${status}`}
                          checked={filters.status?.includes(status) || false}
                          onCheckedChange={(checked) => {
                            setFilters(prev => ({
                              ...prev,
                              status: checked
                                ? [...(prev.status || []), status]
                                : prev.status?.filter(s => s !== status) || [],
                            }));
                          }}
                        />
                        <label
                          htmlFor={`filter-status-${status}`}
                          className="text-sm font-normal cursor-pointer capitalize"
                        >
                          {status.replace('-', ' ')}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Priority</Label>
                  <div className="space-y-2">
                    {(['P1', 'P2', 'P3', 'P4', 'P5'] as TaskPriority[]).map((priority) => (
                      <div key={priority} className="flex items-center space-x-2">
                        <Checkbox
                          id={`filter-priority-${priority}`}
                          checked={filters.priority?.includes(priority) || false}
                          onCheckedChange={(checked) => {
                            setFilters(prev => ({
                              ...prev,
                              priority: checked
                                ? [...(prev.priority || []), priority]
                                : prev.priority?.filter(p => p !== priority) || [],
                            }));
                          }}
                        />
                        <label
                          htmlFor={`filter-priority-${priority}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {priority}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Team</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {metadata.teams.map((team) => (
                      <div key={team} className="flex items-center space-x-2">
                        <Checkbox
                          id={`filter-team-${team}`}
                          checked={filters.assigned_team?.includes(team) || false}
                          onCheckedChange={(checked) => {
                            setFilters(prev => ({
                              ...prev,
                              assigned_team: checked
                                ? [...(prev.assigned_team || []), team]
                                : prev.assigned_team?.filter(t => t !== team) || [],
                            }));
                          }}
                        />
                        <label
                          htmlFor={`filter-team-${team}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {team}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Assigned To</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {members.map((member) => (
                      <div key={member.user_id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`filter-assignee-${member.user_id}`}
                          checked={filters.assigned_to?.includes(member.user_id) || false}
                          onCheckedChange={(checked) => {
                            setFilters(prev => ({
                              ...prev,
                              assigned_to: checked
                                ? [...(prev.assigned_to || []), member.user_id]
                                : prev.assigned_to?.filter(id => id !== member.user_id) || [],
                            }));
                          }}
                        />
                        <label
                          htmlFor={`filter-assignee-${member.user_id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {member.user.full_name || 'Unknown'}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                {(filters.status?.length || filters.priority?.length || filters.assigned_to?.length || filters.assigned_team?.length) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters({})}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
          <Select value={groupBy} onValueChange={(value) => setGroupBy(value as TaskGroupBy)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Grouping</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="assignee">Assignee</SelectItem>
              <SelectItem value="assigned_team">Team</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={`${sort.field}-${sort.direction}`}
            onValueChange={(value) => {
              const [field, direction] = value.split('-');
              setSort({ field: field as TaskSort['field'], direction: direction as TaskSort['direction'] });
            }}
          >
            <SelectTrigger className="w-[140px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="task_number-asc">Task ID</SelectItem>
              <SelectItem value="title-asc">Title A-Z</SelectItem>
              <SelectItem value="title-desc">Title Z-A</SelectItem>
              <SelectItem value="status-asc">Status</SelectItem>
              <SelectItem value="priority-asc">Priority (P1-P5)</SelectItem>
              <SelectItem value="due_date-asc">Due Date</SelectItem>
              <SelectItem value="created_at-desc">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>Add a new task to track project progress.</DialogDescription>
            </DialogHeader>
            <TaskForm
              task={newTask}
              onChange={(updates) => {
                setNewTask(prev => ({ ...prev, ...updates }));
                // Clear error for the field being updated
                if (updates.title !== undefined) {
                  setFormErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.title;
                    return newErrors;
                  });
                }
                if (updates.description !== undefined) {
                  setFormErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.description;
                    return newErrors;
                  });
                }
                if (updates.due_date !== undefined) {
                  setFormErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.due_date;
                    return newErrors;
                  });
                }
                if (updates.estimated_hours !== undefined) {
                  setFormErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.estimated_hours;
                    return newErrors;
                  });
                }
              }}
              members={members}
              metadata={metadata}
              errors={formErrors}
            />
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setFormErrors({});
                  setNewTask({
                    project_id: projectId,
                    title: '',
                    description: '',
                    status: 'todo',
                    priority: 'P2',
                  });
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateTask} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tasks Table */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading tasks...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
            <Card key={groupName}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {groupName} ({groupTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[1200px]">
                    <thead className="bg-muted/50 sticky top-0 z-10">
                      <tr className="border-b">
                        <th className="text-left px-6 py-4 font-medium text-sm text-muted-foreground whitespace-nowrap">ID</th>
                        <th className="text-left px-6 py-4 font-medium text-sm text-muted-foreground whitespace-nowrap min-w-[300px]">Task</th>
                        <th className="text-left px-6 py-4 font-medium text-sm text-muted-foreground whitespace-nowrap">Status</th>
                        <th className="text-left px-6 py-4 font-medium text-sm text-muted-foreground whitespace-nowrap min-w-[130px]">Priority</th>
                        <th className="text-left px-6 py-4 font-medium text-sm text-muted-foreground whitespace-nowrap">Team</th>
                        <th className="text-left px-6 py-4 font-medium text-sm text-muted-foreground whitespace-nowrap min-w-[220px]">Assignee</th>
                        <th className="text-left px-6 py-4 font-medium text-sm text-muted-foreground whitespace-nowrap">Due Date & Time</th>
                        <th className="text-left px-6 py-4 font-medium text-sm text-muted-foreground whitespace-nowrap">Links</th>
                        <th className="text-left px-6 py-4 font-medium text-sm text-muted-foreground whitespace-nowrap">Tags</th>
                        {customProperties.map((prop) => (
                          <th key={prop.id} className="text-left px-6 py-4 font-medium text-sm text-muted-foreground whitespace-nowrap relative group min-w-[150px]">
                            <div className="flex items-center gap-2">
                              <span>{prop.property_name}</span>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteCustomProperty(prop.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Column
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </th>
                        ))}
                        <th className="text-left px-6 py-4 font-medium text-sm text-muted-foreground whitespace-nowrap w-[80px] relative">
                          <Dialog 
                            open={isCustomColumnDialogOpen} 
                            onOpenChange={(open) => {
                              setIsCustomColumnDialogOpen(open);
                              if (!open) {
                                setPropertyOptionsText('');
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Add Custom Column">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Add Custom Column</DialogTitle>
                                <DialogDescription>
                                  Create a new custom column with a specific data type
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="property_name">Column Name *</Label>
                                  <Input
                                    id="property_name"
                                    value={newCustomProperty.property_name}
                                    onChange={(e) =>
                                      setNewCustomProperty({ ...newCustomProperty, property_name: e.target.value })
                                    }
                                    placeholder="e.g., Category, Budget, Owner"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="property_type">Data Type *</Label>
                                  <Select
                                    value={newCustomProperty.property_type}
                                    onValueChange={(value: any) => {
                                      setNewCustomProperty({ ...newCustomProperty, property_type: value });
                                      // Reset options text when type changes
                                      if (value !== 'dropdown' && value !== 'tags') {
                                        setPropertyOptionsText('');
                                      }
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="text">Text</SelectItem>
                                      <SelectItem value="number">Number</SelectItem>
                                      <SelectItem value="date">Date</SelectItem>
                                      <SelectItem value="boolean">Checkbox</SelectItem>
                                      <SelectItem value="dropdown">Dropdown</SelectItem>
                                      <SelectItem value="tags">Tags</SelectItem>
                                      <SelectItem value="url">URL</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                {(newCustomProperty.property_type === 'dropdown' || newCustomProperty.property_type === 'tags') && (
                                  <div className="space-y-2">
                                    <Label>Options (one per line)</Label>
                                    <Textarea
                                      value={propertyOptionsText}
                                      onChange={(e) => {
                                        // Allow free typing with Enter key for new lines
                                        setPropertyOptionsText(e.target.value);
                                      }}
                                      placeholder="Option 1&#10;Option 2&#10;Option 3"
                                      rows={4}
                                    />
                                  </div>
                                )}
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="is_required"
                                    checked={newCustomProperty.is_required}
                                    onCheckedChange={(checked) =>
                                      setNewCustomProperty({ ...newCustomProperty, is_required: checked as boolean })
                                    }
                                  />
                                  <Label htmlFor="is_required" className="cursor-pointer">
                                    Required field
                                  </Label>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => {
                                  setIsCustomColumnDialogOpen(false);
                                  setPropertyOptionsText('');
                                }}>
                                  Cancel
                                </Button>
                                <Button onClick={handleCreateCustomProperty}>Create Column</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                        {groupTasks.length === 0 ? (
                          <tr>
                            <td colSpan={10 + customProperties.length} className="px-6 py-8 text-center text-muted-foreground">
                              No tasks found
                            </td>
                          </tr>
                        ) : (
                          groupTasks.map((task) => (
                            <tr key={task.id} className="border-b hover:bg-muted/50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-medium text-muted-foreground">
                                  #{task.task_number || '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-2 min-w-[300px] max-w-[400px]">
                                  <div
                                    className="font-medium cursor-pointer hover:text-primary transition-colors break-words"
                                    onClick={() => handleEditTask(task)}
                                  >
                                    {task.title}
                                  </div>
                                  {task.description && (
                                    <div className="text-sm text-muted-foreground line-clamp-2 break-words">
                                      {task.description}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Select
                                  value={task.status}
                                  onValueChange={(value) =>
                                    handleUpdateTask(task.id, { status: value as TaskStatus })
                                  }
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <div className="flex items-center gap-2">
                                      {getStatusIcon(task.status)}
                                      <SelectValue />
                                    </div>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="todo">To Do</SelectItem>
                                    <SelectItem value="in-progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Select
                                  value={task.priority_label || task.priority || 'P2'}
                                  onValueChange={(value) =>
                                    handleUpdateTask(task.id, { priority: value as TaskPriority })
                                  }
                                >
                                  <SelectTrigger className="w-[130px] min-w-[130px]">
                                    <Badge className={getPriorityColor(task.priority_label || task.priority || 'P2') + ' whitespace-nowrap'}>
                                      <SelectValue />
                                    </Badge>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="P1">P1 (Highest)</SelectItem>
                                    <SelectItem value="P2">P2 (High)</SelectItem>
                                    <SelectItem value="P3">P3 (Medium)</SelectItem>
                                    <SelectItem value="P4">P4 (Low)</SelectItem>
                                    <SelectItem value="P5">P5 (Lowest)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Input
                                  type="text"
                                  defaultValue={task.assigned_team || ''}
                                  key={`${task.id}-team-${task.assigned_team || ''}`} // Force re-render when value changes
                                  onBlur={(e) => {
                                    const value = e.target.value.trim();
                                    handleUpdateTask(task.id, { assigned_team: value || undefined });
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.currentTarget.blur();
                                    }
                                  }}
                                  placeholder="Team name"
                                  className="w-[140px]"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Select
                                  value={task.assigned_to || '__unassigned__'}
                                  onValueChange={(value) =>
                                    handleUpdateTask(task.id, { assigned_to: value === '__unassigned__' ? undefined : value })
                                  }
                                >
                                  <SelectTrigger className="w-[220px] min-w-[220px] max-w-[220px]">
                                    {task.assignee ? (
                                      <div className="flex items-center gap-2 min-w-0 w-full">
                                        <Avatar className="h-5 w-5 flex-shrink-0">
                                          <AvatarImage src={task.assignee.avatar_url} />
                                          <AvatarFallback>
                                            {task.assignee.full_name?.[0]?.toUpperCase() || '?'}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="truncate flex-1 min-w-0">{task.assignee.full_name}</span>
                                      </div>
                                    ) : (
                                      <SelectValue placeholder="Unassigned" />
                                    )}
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__unassigned__">Unassigned</SelectItem>
                                    {members.map((member) => (
                                      <SelectItem key={member.user_id} value={member.user_id}>
                                        <div className="flex items-center gap-2">
                                          <Avatar className="h-5 w-5">
                                            <AvatarImage src={member.user.avatar_url} />
                                            <AvatarFallback>
                                              {member.user.full_name?.[0]?.toUpperCase() || '?'}
                                            </AvatarFallback>
                                          </Avatar>
                                          {member.user.full_name || 'Unknown'}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Input
                                  type="datetime-local"
                                  value={task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    handleUpdateTask(task.id, { 
                                      due_date: value ? new Date(value).toISOString() : undefined 
                                    });
                                  }}
                                  className="w-[200px]"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-2 flex-wrap max-w-[200px] overflow-hidden">
                                  {task.supporting_links?.map((link, idx) => (
                                    <a
                                      key={idx}
                                      href={link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:underline truncate flex items-center gap-1 max-w-full"
                                      title={link}
                                    >
                                      🔗 <span className="truncate">{link}</span>
                                    </a>
                                  ))}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-2 flex-wrap max-w-[250px] overflow-hidden">
                                  {task.tags?.map((tag, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs whitespace-nowrap">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </td>
                              {customProperties.map((prop) => {
                                const value = task.custom_properties?.[prop.property_name];
                                return (
                                  <td key={prop.id} className="px-6 py-4 whitespace-nowrap">
                                    {renderCustomPropertyCell(task.id, prop, value)}
                                  </td>
                                );
                              })}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditTask(task)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteTask(task.id)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details and properties.</DialogDescription>
          </DialogHeader>
          {editingTask && (
            <TaskForm
              task={editingTask}
              onChange={(updates) => {
                setEditingTask({ ...editingTask, ...updates } as ProjectTask);
                // Clear error for the field being updated
                if (updates.title !== undefined) {
                  setFormErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.title;
                    return newErrors;
                  });
                }
                if (updates.description !== undefined) {
                  setFormErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.description;
                    return newErrors;
                  });
                }
                if (updates.due_date !== undefined) {
                  setFormErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.due_date;
                    return newErrors;
                  });
                }
                if (updates.estimated_hours !== undefined) {
                  setFormErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.estimated_hours;
                    return newErrors;
                  });
                }
                if (updates.actual_hours !== undefined) {
                  setFormErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.actual_hours;
                    return newErrors;
                  });
                }
              }}
              members={members}
              metadata={metadata}
              errors={formErrors}
            />
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingTask(null);
                setFormErrors({});
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Task Form Component
interface TaskFormProps {
  task: Partial<ProjectTask> | Partial<CreateTaskInput>;
  onChange: (updates: any) => void;
  members: Array<{
    id: string;
    user_id: string;
    user: {
      full_name?: string;
      avatar_url?: string;
    };
  }>;
  metadata: {
    tags: string[];
    labels: string[];
    teams: string[];
  };
  errors?: Record<string, string>;
}

function TaskForm({ task, onChange, members, metadata, errors = {} }: TaskFormProps) {
  const [newTag, setNewTag] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const addTag = () => {
    if (newTag.trim() && !task.tags?.includes(newTag.trim())) {
      onChange({ tags: [...(task.tags || []), newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    onChange({ tags: task.tags?.filter(t => t !== tag) || [] });
  };

  const addLabel = () => {
    if (newLabel.trim() && !task.labels?.includes(newLabel.trim())) {
      onChange({ labels: [...(task.labels || []), newLabel.trim()] });
      setNewLabel('');
    }
  };

  const removeLabel = (label: string) => {
    onChange({ labels: task.labels?.filter(l => l !== label) || [] });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={task.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Task title"
          className={errors.title ? 'border-red-500' : ''}
        />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={task.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Task description"
          rows={3}
          className={errors.description ? 'border-red-500' : ''}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={task.status || 'todo'}
            onValueChange={(value) => onChange({ status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={task.priority_label || (task.priority ? (task.priority === 'high' ? 'P1' : task.priority === 'medium' ? 'P2' : 'P3') : 'P2') || 'P2'}
            onValueChange={(value) => onChange({ priority: value as TaskPriority })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="P1">P1 (Highest)</SelectItem>
              <SelectItem value="P2">P2 (High)</SelectItem>
              <SelectItem value="P3">P3 (Medium)</SelectItem>
              <SelectItem value="P4">P4 (Low)</SelectItem>
              <SelectItem value="P5">P5 (Lowest)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="assigned_team">Assigned Team</Label>
          <Input
            id="assigned_team"
            type="text"
            value={task.assigned_team || ''}
            onChange={(e) => onChange({ assigned_team: e.target.value || undefined })}
            placeholder="Team name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="assigned_to">Assigned To</Label>
          <Select
            value={task.assigned_to || '__unassigned__'}
            onValueChange={(value) => onChange({ assigned_to: value === '__unassigned__' ? undefined : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__unassigned__">Unassigned</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.user_id} value={member.user_id}>
                  {member.user.full_name || 'Unknown'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="due_date">Due Date & Time</Label>
          <Input
            id="due_date"
            type="datetime-local"
            value={task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : ''}
            onChange={(e) => {
              const value = e.target.value;
              onChange({ due_date: value ? new Date(value).toISOString() : undefined });
            }}
            className={errors.due_date ? 'border-red-500' : ''}
          />
          {errors.due_date && (
            <p className="text-sm text-red-500">{errors.due_date}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="supporting_links">Supporting Links</Label>
          <div className="space-y-2">
            {task.supporting_links?.map((link, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <Input
                  value={link}
                  onChange={(e) => {
                    const newLinks = [...(task.supporting_links || [])];
                    newLinks[idx] = e.target.value;
                    onChange({ supporting_links: newLinks });
                  }}
                  placeholder="https://..."
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newLinks = task.supporting_links?.filter((_, i) => i !== idx) || [];
                    onChange({ supporting_links: newLinks });
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onChange({ supporting_links: [...(task.supporting_links || []), ''] });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Link
            </Button>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex gap-2 flex-wrap mb-2">
          {task.tags?.map((tag, idx) => (
            <Badge key={idx} variant="secondary" className="gap-1 pr-1">
              <span>{tag}</span>
              <button
                type="button"
                className="ml-0.5 h-4 w-4 flex items-center justify-center rounded-full hover:bg-destructive/20 transition-colors focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  removeTag(tag);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                aria-label={`Remove ${tag} tag`}
              >
                <X className="h-3 w-3 hover:text-destructive" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addTag();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addTag}>
            Add
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Labels</Label>
        <div className="flex gap-2 flex-wrap mb-2">
          {task.labels?.map((label, idx) => (
            <Badge key={idx} variant="outline" className="gap-1 pr-1">
              <span>{label}</span>
              <button
                type="button"
                className="ml-0.5 h-4 w-4 flex items-center justify-center rounded-full hover:bg-destructive/20 transition-colors focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  removeLabel(label);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                aria-label={`Remove ${label} label`}
              >
                <X className="h-3 w-3 hover:text-destructive" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add label"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addLabel();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addLabel}>
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}

