

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Clock, 
  Calendar,
  User,
  Tag,
  AlertCircle,
  CheckCircle,
  Play,
  Pause,
  Square,
  Search,
  Filter,
  ArrowUpDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import type { GlobalTask, GlobalTaskCategory, GlobalTaskTag } from "@/lib/types/global-tasks";

interface GlobalTaskListProps {
  tasks: GlobalTask[];
  categories: GlobalTaskCategory[];
  tags: GlobalTaskTag[];
  onTaskUpdate: (taskId: string, data: any) => Promise<void>;
  onTaskDelete: (taskId: string) => Promise<void>;
  onTaskEdit: (task: GlobalTask) => void;
}

export function GlobalTaskList({ tasks, categories, tags, onTaskUpdate, onTaskDelete, onTaskEdit }: GlobalTaskListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || task.category_id === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let aValue: any = a[sortBy as keyof GlobalTask];
    let bValue: any = b[sortBy as keyof GlobalTask];
    
    if (sortBy === 'due_date' || sortBy === 'created_at' || sortBy === 'updated_at') {
      aValue = new Date(aValue || 0).getTime();
      bValue = new Date(bValue || 0).getTime();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSelectTask = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTasks.length === sortedTasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(sortedTasks.map(task => task.id));
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    try {
      await Promise.all(
        selectedTasks.map(taskId => onTaskUpdate(taskId, { status }))
      );
      setSelectedTasks([]);
    } catch (error) {
      console.error('Error updating tasks:', error);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Task List</h2>
        <div className="text-sm text-gray-600">
          {filteredTasks.length} of {tasks.length} tasks
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                name="task_list_search"
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Created Date</SelectItem>
                  <SelectItem value="due_date">Due Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedTasks.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {selectedTasks.length} task(s) selected
                </span>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkStatusUpdate('in-progress')}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Start
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkStatusUpdate('completed')}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Complete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkStatusUpdate('on-hold')}
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    Hold
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkStatusUpdate('cancelled')}
                  >
                    <Square className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTasks([])}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task List */}
      <div className="space-y-4">
        {sortedTasks.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500">
                No tasks found matching your criteria.
              </div>
            </CardContent>
          </Card>
        ) : (
          sortedTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <Checkbox
                    checked={selectedTasks.includes(task.id)}
                    onCheckedChange={() => handleSelectTask(task.id)}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-lg line-clamp-1">
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onTaskEdit(task)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => onTaskDelete(task.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center space-x-4 mt-3">
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace('-', ' ').toUpperCase()}
                      </Badge>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority.toUpperCase()}
                      </Badge>
                      {task.category && (
                        <Badge variant="outline">
                          {task.category.name}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center space-x-6 mt-3 text-sm text-gray-600">
                      {task.due_date && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span className={isOverdue(task.due_date) ? 'text-red-600' : ''}>
                            Due {formatDate(task.due_date)}
                          </span>
                        </div>
                      )}
                      
                      {task.assigned_user && (
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          <span>{task.assigned_user.full_name || 'Unassigned'}</span>
                        </div>
                      )}
                      
                      {task.actual_hours > 0 && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{task.actual_hours}h logged</span>
                        </div>
                      )}
                      
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 mr-1" />
                          <div className="flex space-x-1">
                            {task.tags.slice(0, 3).map((tag) => (
                              <Badge 
                                key={tag.id} 
                                variant="outline" 
                                className="text-xs"
                                style={{ 
                                  borderColor: tag.color,
                                  color: tag.color 
                                }}
                              >
                                {tag.name}
                              </Badge>
                            ))}
                            {task.tags.length > 3 && (
                              <span className="text-xs">+{task.tags.length - 3}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {task.progress > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{task.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Project Link */}
                    {task.project && (
                      <div className="mt-3">
                        <Badge variant="outline" className="text-blue-600">
                          📁 {task.project.name}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
