"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Kanban, 
  List, 
  BarChart3,
  Settings,
  Clock,
  Users,
  Target,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Play,
  Pause,
  Square
} from "lucide-react";
import { toast } from "@/lib/toast";
import type { 
  GlobalTask, 
  GlobalTaskCategory, 
  GlobalTaskTag, 
  GlobalTaskFilters,
  UserTaskPreferences,
  KanbanBoard,
  CalendarEvent,
  GanttChart
} from "@/lib/types/global-tasks";
import {
  getGlobalTasks,
  getGlobalTaskCategories,
  getGlobalTaskTags,
  getUserTaskPreferences,
  updateUserTaskPreferences,
  getKanbanBoard,
  getCalendarEvents,
  getGanttChart,
  createGlobalTask,
  updateGlobalTask,
  deleteGlobalTask
} from "@/lib/api/global-tasks";
import { GlobalTaskForm } from "./global-task-form";
import { GlobalTaskKanban } from "./global-task-kanban";
import { GlobalTaskList } from "./global-task-list";
import { GlobalTaskCalendar } from "./global-task-calendar";
import { GlobalTaskGantt } from "./global-task-gantt";
import { GlobalTaskAnalytics } from "./global-task-analytics";
import { GlobalTaskFilters as GlobalTaskFiltersComponent } from "./global-task-filters";
import { GlobalTaskSettings } from "./global-task-settings";

export function GlobalTaskManager() {
  const [tasks, setTasks] = useState<GlobalTask[]>([]);
  const [categories, setCategories] = useState<GlobalTaskCategory[]>([]);
  const [tags, setTags] = useState<GlobalTaskTag[]>([]);
  const [preferences, setPreferences] = useState<UserTaskPreferences | null>(null);
  const [kanbanBoard, setKanbanBoard] = useState<KanbanBoard | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [ganttChart, setGanttChart] = useState<GanttChart | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'kanban' | 'list' | 'calendar' | 'gantt' | 'analytics'>('kanban');
  const [activeTab, setActiveTab] = useState('tasks');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<GlobalTaskFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingTask, setEditingTask] = useState<GlobalTask | null>(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load data when filters change
  useEffect(() => {
    loadTasks();
  }, [filters, searchQuery]);

  // Load view-specific data
  useEffect(() => {
    switch (activeView) {
      case 'kanban':
        loadKanbanBoard();
        break;
      case 'calendar':
        loadCalendarEvents();
        break;
      case 'gantt':
        loadGanttChart();
        break;
    }
  }, [activeView]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTasks(),
        loadCategories(),
        loadTags(),
        loadPreferences()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load task data');
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const { data, error } = await getGlobalTasks({
        ...filters,
        search: searchQuery || undefined
      });
      
      if (error) {
        throw error;
      }
      
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Failed to load tasks');
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await getGlobalTaskCategories();
      if (error) throw error;
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadTags = async () => {
    try {
      const { data, error } = await getGlobalTaskTags();
      if (error) throw error;
      setTags(data);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const loadPreferences = async () => {
    try {
      const { data, error } = await getUserTaskPreferences();
      if (error) throw error;
      setPreferences(data);
      if (data) {
        setActiveView(data.default_view);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const loadKanbanBoard = async () => {
    try {
      const { data, error } = await getKanbanBoard();
      if (error) throw error;
      setKanbanBoard(data);
    } catch (error) {
      console.error('Error loading kanban board:', error);
    }
  };

  const loadCalendarEvents = async () => {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 2);
      
      const { data, error } = await getCalendarEvents(
        startDate.toISOString(),
        endDate.toISOString()
      );
      if (error) throw error;
      setCalendarEvents(data);
    } catch (error) {
      console.error('Error loading calendar events:', error);
    }
  };

  const loadGanttChart = async () => {
    try {
      const { data, error } = await getGanttChart();
      if (error) throw error;
      setGanttChart(data);
    } catch (error) {
      console.error('Error loading gantt chart:', error);
    }
  };

  const handleCreateTask = async (taskData: any) => {
    try {
      const { data, error } = await createGlobalTask(taskData);
      if (error) throw error;
      
      toast.success('Task created successfully');
      setShowTaskForm(false);
      await loadTasks();
      if (activeView === 'kanban') {
        await loadKanbanBoard();
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };

  const handleUpdateTask = async (taskId: string, taskData: any) => {
    try {
      const { data, error } = await updateGlobalTask(taskId, taskData);
      if (error) throw error;
      
      toast.success('Task updated successfully');
      setEditingTask(null);
      await loadTasks();
      if (activeView === 'kanban') {
        await loadKanbanBoard();
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const { error } = await deleteGlobalTask(taskId);
      if (error) throw error;
      
      toast.success('Task deleted successfully');
      await loadTasks();
      if (activeView === 'kanban') {
        await loadKanbanBoard();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleViewChange = async (view: 'kanban' | 'list' | 'calendar' | 'gantt' | 'analytics') => {
    setActiveView(view);
    
    // Update user preferences
    if (preferences && view !== 'analytics') {
      try {
        await updateUserTaskPreferences({ default_view: view });
        setPreferences({ ...preferences, default_view: view });
      } catch (error) {
        console.error('Error updating preferences:', error);
      }
    }
  };

  const handleFiltersChange = (newFilters: GlobalTaskFilters) => {
    setFilters(newFilters);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Global Task Management</CardTitle>
              <CardDescription className="mt-2">
                Manage all your tasks across projects and personal work
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button
                onClick={() => setShowTaskForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold">{tasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold">
                  {tasks.filter(t => t.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold">
                  {tasks.filter(t => t.status === 'in-progress').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold">
                  {tasks.filter(t => 
                    t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                name="global_tasks_search"
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <div className="flex items-center space-x-2">
              <Button
                variant={activeView === 'kanban' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewChange('kanban')}
              >
                <Kanban className="h-4 w-4" />
              </Button>
              <Button
                variant={activeView === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewChange('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={activeView === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewChange('calendar')}
              >
                <Calendar className="h-4 w-4" />
              </Button>
              <Button
                variant={activeView === 'gantt' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewChange('gantt')}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                variant={activeView === 'analytics' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewChange('analytics')}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <div className="mt-4">
              <GlobalTaskFiltersComponent
                categories={categories}
                tags={tags}
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="space-y-6">
        {activeView === 'kanban' && kanbanBoard && (
          <GlobalTaskKanban
            board={kanbanBoard}
            onTaskUpdate={handleUpdateTask}
            onTaskDelete={handleDeleteTask}
            onTaskEdit={(task) => setEditingTask(task)}
          />
        )}
        
        {activeView === 'list' && (
          <GlobalTaskList
            tasks={tasks}
            categories={categories}
            tags={tags}
            onTaskUpdate={handleUpdateTask}
            onTaskDelete={handleDeleteTask}
            onTaskEdit={(task) => setEditingTask(task)}
          />
        )}
        
        {activeView === 'calendar' && (
          <GlobalTaskCalendar
            events={calendarEvents}
            onTaskUpdate={handleUpdateTask}
            onTaskDelete={handleDeleteTask}
            onTaskEdit={(task) => setEditingTask(task)}
          />
        )}
        
        {activeView === 'gantt' && ganttChart && (
          <GlobalTaskGantt
            chart={ganttChart}
            onTaskUpdate={handleUpdateTask}
            onTaskDelete={handleDeleteTask}
            onTaskEdit={(task) => setEditingTask(task)}
          />
        )}
        
        {activeView === 'analytics' && (
          <GlobalTaskAnalytics />
        )}
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <GlobalTaskForm
          categories={categories}
          tags={tags}
          onSubmit={handleCreateTask}
          onCancel={() => setShowTaskForm(false)}
        />
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <GlobalTaskForm
          task={editingTask}
          categories={categories}
          tags={tags}
          onSubmit={(data) => handleUpdateTask(editingTask.id, data)}
          onCancel={() => setEditingTask(null)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <GlobalTaskSettings
          preferences={preferences}
          categories={categories}
          tags={tags}
          onPreferencesUpdate={(prefs) => {
            setPreferences(prefs);
            setShowSettings(false);
          }}
          onCancel={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
