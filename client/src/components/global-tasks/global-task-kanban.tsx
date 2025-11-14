

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Square
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/lib/toast";
import type { KanbanBoard, GlobalTask } from "@/lib/types/global-tasks";
import { updateGlobalTask } from "@/lib/api/global-tasks";

interface GlobalTaskKanbanProps {
  board: KanbanBoard;
  onTaskUpdate: (taskId: string, data: any) => Promise<void>;
  onTaskDelete: (taskId: string) => Promise<void>;
  onTaskEdit: (task: GlobalTask) => void;
}

export function GlobalTaskKanban({ board, onTaskUpdate, onTaskDelete, onTaskEdit }: GlobalTaskKanbanProps) {
  const [draggedTask, setDraggedTask] = useState<GlobalTask | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, task: GlobalTask) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnStatus: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverColumn(columnStatus);
  };

  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, columnStatus: string) => {
    e.preventDefault();
    
    if (!draggedTask || draggedTask.status === columnStatus) {
      setDraggedTask(null);
      setDraggedOverColumn(null);
      return;
    }

    try {
      await onTaskUpdate(draggedTask.id, { status: columnStatus });
      toast.success('Task status updated');
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    }

    setDraggedTask(null);
    setDraggedOverColumn(null);
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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="h-3 w-3" />;
      case 'high': return <AlertCircle className="h-3 w-3" />;
      case 'medium': return <Clock className="h-3 w-3" />;
      case 'low': return <CheckCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${diffDays} days`;
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Kanban Board</h2>
        <div className="text-sm text-gray-600">
          {board.total_tasks} total tasks
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {board.columns.map((column) => (
          <div key={column.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: column.color }}
                />
                <h3 className="font-medium">{column.title}</h3>
              </div>
              <Badge variant="secondary" className="text-xs">
                {column.tasks.length}
              </Badge>
            </div>

            <div
              className={`min-h-[400px] space-y-3 p-3 rounded-lg border-2 border-dashed transition-colors ${
                draggedOverColumn === column.status
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200'
              }`}
              onDragOver={(e) => handleDragOver(e, column.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              {column.tasks.map((task) => (
                <Card
                  key={task.id}
                  className={`cursor-move hover:shadow-md transition-shadow ${
                    draggedTask?.id === task.id ? 'opacity-50' : ''
                  }`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Task Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreHorizontal className="h-3 w-3" />
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

                      {/* Priority and Status */}
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getPriorityColor(task.priority)}`}
                        >
                          {getPriorityIcon(task.priority)}
                          <span className="ml-1">{task.priority}</span>
                        </Badge>
                        {task.category && (
                          <Badge variant="outline" className="text-xs">
                            {task.category.name}
                          </Badge>
                        )}
                      </div>

                      {/* Progress */}
                      {task.progress > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Progress</span>
                            <span>{task.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full transition-all"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Due Date */}
                      {task.due_date && (
                        <div className="flex items-center text-xs text-gray-600">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span className={isOverdue(task.due_date) ? 'text-red-600' : ''}>
                            {formatDate(task.due_date)}
                          </span>
                        </div>
                      )}

                      {/* Assigned User */}
                      {task.assigned_user && (
                        <div className="flex items-center text-xs text-gray-600">
                          <User className="h-3 w-3 mr-1" />
                          <span>{task.assigned_user.full_name || 'Unassigned'}</span>
                        </div>
                      )}

                      {/* Tags */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <Tag className="h-3 w-3 text-gray-400" />
                          <div className="flex flex-wrap gap-1">
                            {task.tags.slice(0, 2).map((tag) => (
                              <Badge 
                                key={tag.id} 
                                variant="outline" 
                                className="text-xs px-1 py-0"
                                style={{ 
                                  borderColor: tag.color,
                                  color: tag.color 
                                }}
                              >
                                {tag.name}
                              </Badge>
                            ))}
                            {task.tags.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{task.tags.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Time Tracking */}
                      {task.actual_hours > 0 && (
                        <div className="flex items-center text-xs text-gray-600">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{task.actual_hours}h logged</span>
                        </div>
                      )}

                      {/* Project Link */}
                      {task.project && (
                        <div className="flex items-center text-xs text-blue-600">
                          <span>📁 {task.project.name}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {column.tasks.length === 0 && (
                <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                  No tasks in this column
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
