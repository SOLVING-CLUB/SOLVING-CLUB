"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Link, 
  Unlink, 
  Search, 
  Plus, 
  ExternalLink,
  Calendar,
  User,
  Tag,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { toast } from "@/lib/toast";
import type { GlobalTask } from "@/lib/types/global-tasks";
import { getGlobalTasks, updateGlobalTask } from "@/lib/api/global-tasks";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

interface TaskLinkingManagerProps {
  projectId: string;
  projectTaskId?: string;
  onTaskLinked?: (globalTaskId: string, projectTaskId: string) => void;
  onTaskUnlinked?: (globalTaskId: string) => void;
}

interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  assigned_to?: string;
  created_at: string;
}

export function TaskLinkingManager({ 
  projectId, 
  projectTaskId, 
  onTaskLinked, 
  onTaskUnlinked 
}: TaskLinkingManagerProps) {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableTasks, setAvailableTasks] = useState<GlobalTask[]>([]);
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [linkedTasks, setLinkedTasks] = useState<GlobalTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGlobalTask, setSelectedGlobalTask] = useState<string>('');
  const [selectedProjectTask, setSelectedProjectTask] = useState<string>('');

  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    loadProjectTasks();
    loadLinkedTasks();
  }, [projectId]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchGlobalTasks();
    } else {
      setAvailableTasks([]);
    }
  }, [searchQuery]);

  const loadProjectTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjectTasks(data || []);
    } catch (error) {
      console.error('Error loading project tasks:', error);
    }
  };

  const loadLinkedTasks = async () => {
    try {
      const { data, error } = await getGlobalTasks({
        project_id: [projectId]
      });

      if (error) throw error;
      setLinkedTasks(data);
    } catch (error) {
      console.error('Error loading linked tasks:', error);
    }
  };

  const searchGlobalTasks = async () => {
    try {
      const { data, error } = await getGlobalTasks({
        search: searchQuery,
        project_id: [] // Exclude tasks already linked to projects
      });

      if (error) throw error;
      setAvailableTasks(data);
    } catch (error) {
      console.error('Error searching global tasks:', error);
    }
  };

  const handleLinkTask = async () => {
    if (!selectedGlobalTask || !selectedProjectTask) {
      toast.error('Please select both a global task and a project task');
      return;
    }

    setLoading(true);
    try {
      const { error } = await updateGlobalTask(selectedGlobalTask, {
        project_id: projectId,
        project_task_id: selectedProjectTask
      });

      if (error) throw error;

      toast.success('Tasks linked successfully');
      setShowLinkDialog(false);
      setSelectedGlobalTask('');
      setSelectedProjectTask('');
      setSearchQuery('');
      setAvailableTasks([]);
      
      await loadLinkedTasks();
      onTaskLinked?.(selectedGlobalTask, selectedProjectTask);
    } catch (error) {
      console.error('Error linking tasks:', error);
      toast.error('Failed to link tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkTask = async (globalTaskId: string) => {
    if (!confirm('Are you sure you want to unlink this task?')) return;

    setLoading(true);
    try {
      const { error } = await updateGlobalTask(
        globalTaskId,
        {
          project_id: null,
          project_task_id: null,
        } as any
      );

      if (error) throw error;

      toast.success('Task unlinked successfully');
      await loadLinkedTasks();
      onTaskUnlinked?.(globalTaskId);
    } catch (error) {
      console.error('Error unlinking task:', error);
      toast.error('Failed to unlink task');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Task Linking</h3>
          <p className="text-sm text-gray-600">
            Link global tasks to project tasks for better organization
          </p>
        </div>
        <Button onClick={() => setShowLinkDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Link Task
        </Button>
      </div>

      {/* Linked Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Link className="h-5 w-5 mr-2" />
            Linked Tasks ({linkedTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {linkedTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Link className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No tasks linked to this project yet</p>
              <p className="text-sm">Click "Link Task" to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {linkedTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium">{task.title}</h4>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace('-', ' ').toUpperCase()}
                      </Badge>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority.toUpperCase()}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      {task.due_date && (
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {task.assigned_user && (
                        <div className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          <span>{task.assigned_user.full_name || 'Unassigned'}</span>
                        </div>
                      )}
                      {task.project_task && (
                        <div className="flex items-center text-blue-600">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          <span>Linked to: {task.project_task.title}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnlinkTask(task.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Unlink className="h-4 w-4 mr-1" />
                    Unlink
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link Task Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Link Global Task to Project Task</DialogTitle>
            <DialogDescription>
              Connect a global task with a specific project task for better organization and tracking.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Search Global Tasks */}
            <div>
              <Label htmlFor="search">Search Global Tasks</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search for global tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {availableTasks.length > 0 && (
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                  {availableTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        selectedGlobalTask === task.id ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedGlobalTask(task.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{task.title}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getStatusColor(task.status)}>
                              {task.status.replace('-', ' ').toUpperCase()}
                            </Badge>
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        {selectedGlobalTask === task.id && (
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Select Project Task */}
            <div>
              <Label htmlFor="project_task">Select Project Task</Label>
              <Select value={selectedProjectTask} onValueChange={setSelectedProjectTask}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Choose a project task to link" />
                </SelectTrigger>
                <SelectContent>
                  {projectTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      <div className="flex items-center space-x-2">
                        <span>{task.title}</span>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.replace('-', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            {selectedGlobalTask && selectedProjectTask && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Link Preview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Global Task:</span>
                    <span>{availableTasks.find(t => t.id === selectedGlobalTask)?.title}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Project Task:</span>
                    <span>{projectTasks.find(t => t.id === selectedProjectTask)?.title}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleLinkTask} 
              disabled={loading || !selectedGlobalTask || !selectedProjectTask}
            >
              {loading ? 'Linking...' : 'Link Tasks'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
