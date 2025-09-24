"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Calendar,
  Clock,
  User,
  Tag,
  AlertCircle
} from "lucide-react";
import { format, differenceInDays, addDays, startOfWeek, endOfWeek } from "date-fns";
import type { GanttChart, GlobalTask } from "@/lib/types/global-tasks";

interface GlobalTaskGanttProps {
  chart: GanttChart;
  onTaskUpdate: (taskId: string, data: any) => Promise<void>;
  onTaskDelete: (taskId: string) => Promise<void>;
  onTaskEdit: (task: GlobalTask) => void;
}

export function GlobalTaskGantt({ chart, onTaskUpdate, onTaskDelete, onTaskEdit }: GlobalTaskGanttProps) {
  const [zoom, setZoom] = useState(1);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(addDays(new Date(), 30));
  const [selectedTask, setSelectedTask] = useState<GlobalTask | null>(null);
  const ganttRef = useRef<HTMLDivElement>(null);

  const minDate = new Date(Math.min(...chart.tasks.map(t => new Date(t.start).getTime())));
  const maxDate = new Date(Math.max(...chart.tasks.map(t => new Date(t.end).getTime())));

  const getDateRange = () => {
    const totalDays = differenceInDays(endDate, startDate);
    const visibleDays = Math.ceil(totalDays / zoom);
    return { totalDays, visibleDays };
  };

  const getTaskPosition = (task: any) => {
    const taskStart = new Date(task.start);
    const taskEnd = new Date(task.end);
    const daysFromStart = differenceInDays(taskStart, startDate);
    const taskDuration = differenceInDays(taskEnd, taskStart) + 1;
    
    return {
      left: (daysFromStart / getDateRange().totalDays) * 100,
      width: (taskDuration / getDateRange().totalDays) * 100,
    };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in-progress': return '#3B82F6';
      case 'cancelled': return '#EF4444';
      case 'on-hold': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const generateDateHeaders = () => {
    const dates = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.1));
  };

  const handleDateRangeChange = (days: number) => {
    const newEndDate = addDays(startDate, days);
    setEndDate(newEndDate);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Gantt Chart</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600">Zoom: {zoom.toFixed(1)}x</span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleDateRangeChange(30)}
          >
            30 Days
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleDateRangeChange(90)}
          >
            90 Days
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Gantt Chart */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Date Headers */}
                  <div className="flex border-b border-gray-200 mb-4">
                    <div className="w-64 p-2 border-r border-gray-200 font-medium">
                      Task
                    </div>
                    <div className="flex-1 flex">
                      {generateDateHeaders().map((date, index) => (
                        <div
                          key={index}
                          className="flex-1 p-2 text-center text-xs border-r border-gray-200 min-w-[40px]"
                        >
                          {format(date, 'd')}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-2">
                    {chart.tasks.map((task) => {
                      const position = getTaskPosition(task);
                      const isOverdue = new Date(task.end) < new Date() && task.task.status !== 'completed';
                      
                      return (
                        <div
                          key={task.id}
                          className="flex items-center border-b border-gray-100 py-2 hover:bg-gray-50"
                        >
                          {/* Task Name */}
                          <div className="w-64 p-2 border-r border-gray-200">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: getPriorityColor(task.task.priority) }}
                              />
                              <span 
                                className="text-sm font-medium cursor-pointer hover:text-blue-600"
                                onClick={() => onTaskEdit(task.task)}
                              >
                                {task.title}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {task.task.category?.name}
                            </div>
                          </div>

                          {/* Task Bar */}
                          <div className="flex-1 relative h-8">
                            <div
                              className="absolute top-1 h-6 rounded cursor-pointer hover:opacity-80 transition-opacity"
                              style={{
                                left: `${position.left}%`,
                                width: `${position.width}%`,
                                backgroundColor: getStatusColor(task.task.status),
                                opacity: task.task.status === 'completed' ? 0.7 : 1,
                              }}
                              onClick={() => onTaskEdit(task.task)}
                            >
                              <div className="flex items-center justify-center h-full text-xs text-white font-medium">
                                {task.progress}%
                              </div>
                            </div>
                            
                            {/* Progress Bar */}
                            {task.progress > 0 && (
                              <div
                                className="absolute top-1 h-6 rounded-l bg-white bg-opacity-30"
                                style={{
                                  left: `${position.left}%`,
                                  width: `${(position.width * task.progress) / 100}%`,
                                }}
                              />
                            )}
                            
                            {/* Overdue Indicator */}
                            {isOverdue && (
                              <div className="absolute -top-1 -right-1">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Task Details */}
          {selectedTask && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Task Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">{selectedTask.title}</h4>
                    {selectedTask.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedTask.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge 
                      style={{ backgroundColor: getStatusColor(selectedTask.status) }}
                      className="text-white"
                    >
                      {selectedTask.status.replace('-', ' ').toUpperCase()}
                    </Badge>
                    <Badge 
                      style={{ backgroundColor: getPriorityColor(selectedTask.priority) }}
                      className="text-white"
                    >
                      {selectedTask.priority.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {selectedTask.due_date && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <span>Due: {format(new Date(selectedTask.due_date), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                    
                    {selectedTask.assigned_user && (
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{selectedTask.assigned_user.full_name || 'Unassigned'}</span>
                      </div>
                    )}
                    
                    {selectedTask.actual_hours > 0 && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{selectedTask.actual_hours}h logged</span>
                      </div>
                    )}
                  </div>
                  
                  {selectedTask.tags && selectedTask.tags.length > 0 && (
                    <div>
                      <div className="flex items-center mb-2">
                        <Tag className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm font-medium">Tags</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {selectedTask.tags.map((tag) => (
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
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-2">Priority</h4>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-xs">Urgent</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      <span className="text-xs">High</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-xs">Medium</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-xs">Low</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Status</h4>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-3 rounded bg-green-500" />
                      <span className="text-xs">Completed</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-3 rounded bg-blue-500" />
                      <span className="text-xs">In Progress</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-3 rounded bg-gray-500" />
                      <span className="text-xs">To Do</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-3 rounded bg-yellow-500" />
                      <span className="text-xs">On Hold</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-3 rounded bg-red-500" />
                      <span className="text-xs">Cancelled</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dependencies */}
          {chart.dependencies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dependencies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {chart.dependencies.map((dep) => {
                    const sourceTask = chart.tasks.find(t => t.id === dep.source);
                    const targetTask = chart.tasks.find(t => t.id === dep.target);
                    
                    return (
                      <div key={dep.id} className="text-sm">
                        <div className="font-medium">{sourceTask?.title}</div>
                        <div className="text-gray-600">→ {targetTask?.title}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
