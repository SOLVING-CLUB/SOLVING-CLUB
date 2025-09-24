"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  User,
  Tag,
  AlertCircle
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import type { CalendarEvent, GlobalTask } from "@/lib/types/global-tasks";

interface GlobalTaskCalendarProps {
  events: CalendarEvent[];
  onTaskUpdate: (taskId: string, data: any) => Promise<void>;
  onTaskDelete: (taskId: string) => Promise<void>;
  onTaskEdit: (task: GlobalTask) => void;
}

export function GlobalTaskCalendar({ events, onTaskUpdate, onTaskDelete, onTaskEdit }: GlobalTaskCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add empty days at the beginning to align with Monday start
  const startDay = monthStart.getDay();
  const emptyDays = Array.from({ length: startDay }, (_, i) => null);

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      isSameDay(new Date(event.start), date)
    );
  };

  const getEventsForSelectedDate = () => {
    if (!selectedDate) return [];
    return getEventsForDate(selectedDate);
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Calendar View</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                {format(currentDate, 'MMMM yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
                
                {/* Empty days */}
                {emptyDays.map((_, index) => (
                  <div key={`empty-${index}`} className="p-2" />
                ))}
                
                {/* Calendar days */}
                {calendarDays.map((day) => {
                  const dayEvents = getEventsForDate(day);
                  const isToday = isSameDay(day, new Date());
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  
                  return (
                    <div
                      key={day.toISOString()}
                      className={`p-2 min-h-[100px] border border-gray-200 cursor-pointer hover:bg-gray-50 ${
                        isToday ? 'bg-blue-50' : ''
                      } ${isSelected ? 'bg-blue-100' : ''}`}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isToday ? 'text-blue-600' : ''
                      }`}>
                        {format(day, 'd')}
                      </div>
                      
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded truncate cursor-pointer ${
                              getStatusColor(event.task.status)
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onTaskEdit(event.task);
                            }}
                          >
                            <div className="flex items-center space-x-1">
                              <div 
                                className={`w-2 h-2 rounded-full ${getPriorityColor(event.task.priority)}`}
                              />
                              <span className="truncate">{event.title}</span>
                            </div>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Selected Date Events */}
          {selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {format(selectedDate, 'MMMM d, yyyy')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getEventsForSelectedDate().length === 0 ? (
                    <p className="text-sm text-gray-500">No tasks for this date</p>
                  ) : (
                    getEventsForSelectedDate().map((event) => (
                      <div
                        key={event.id}
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => onTaskEdit(event.task)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-1">
                              {event.title}
                            </h4>
                            {event.task.description && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {event.task.description}
                              </p>
                            )}
                          </div>
                          <div 
                            className={`w-3 h-3 rounded-full ml-2 ${getPriorityColor(event.task.priority)}`}
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge className={getStatusColor(event.task.status)}>
                            {event.task.status.replace('-', ' ').toUpperCase()}
                          </Badge>
                          {event.task.category && (
                            <Badge variant="outline" className="text-xs">
                              {event.task.category.name}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                          {event.task.assigned_user && (
                            <div className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              <span>{event.task.assigned_user.full_name || 'Unassigned'}</span>
                            </div>
                          )}
                          {event.task.actual_hours > 0 && (
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{event.task.actual_hours}h</span>
                            </div>
                          )}
                        </div>
                        
                        {isOverdue(event.task.due_date || '') && event.task.status !== 'completed' && (
                          <div className="flex items-center mt-2 text-xs text-red-600">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            <span>Overdue</span>
                          </div>
                        )}
                      </div>
                    ))
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
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
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
                      <Badge className="bg-green-100 text-green-800 text-xs">Completed</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-blue-100 text-blue-800 text-xs">In Progress</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-gray-100 text-gray-800 text-xs">To Do</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-yellow-100 text-yellow-800 text-xs">On Hold</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-red-100 text-red-800 text-xs">Cancelled</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
