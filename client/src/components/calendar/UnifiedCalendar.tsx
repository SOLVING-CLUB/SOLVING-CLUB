import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckSquare, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type CalendarView = 'month' | 'week';

type CalendarEvent = {
    id: string;
    title: string;
    date: Date;
    type: 'task' | 'deadline';
    color: string;
    metadata?: any;
};

export default function UnifiedCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<CalendarView>('month');
    const [events, setEvents] = useState<CalendarEvent[]>([]);

    useEffect(() => {
        fetchEvents();
    }, [currentDate, view]);

    const fetchEvents = async () => {
        // Fetch tasks
        const { data: tasks } = await supabase
            .from('project_tasks')
            .select('id, title, due_date, project:projects(name)')
            .not('due_date', 'is', null);

        const taskEvents: CalendarEvent[] = (tasks || []).map((t: any) => ({
            id: t.id,
            title: t.title,
            date: new Date(t.due_date),
            type: 'task',
            color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
            metadata: t
        }));

        setEvents([...taskEvents]);
    };

    const nextPeriod = () => {
        if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
        else setCurrentDate(addWeeks(currentDate, 1));
    };

    const prevPeriod = () => {
        if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
        else setCurrentDate(subWeeks(currentDate, 1));
    };

    const days = view === 'month'
        ? eachDayOfInterval({ start: startOfWeek(startOfMonth(currentDate)), end: endOfWeek(endOfMonth(currentDate)) })
        : eachDayOfInterval({ start: startOfWeek(currentDate), end: endOfWeek(currentDate) });

    return (
        <Card className="h-[calc(100vh-12rem)] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
                <div className="flex items-center space-x-4">
                    <CardTitle className="text-2xl font-bold">
                        {format(currentDate, 'MMMM yyyy')}
                    </CardTitle>
                    <div className="flex items-center rounded-md border bg-muted/50 p-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setView('month')}
                            className={cn(view === 'month' && "bg-background shadow-sm")}
                        >
                            Month
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setView('week')}
                            className={cn(view === 'week' && "bg-background shadow-sm")}
                        >
                            Week
                        </Button>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="icon" onClick={prevPeriod}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                        Today
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextPeriod}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-y-auto">
                <div className={cn(
                    "grid h-full",
                    view === 'month' ? "grid-cols-7 grid-rows-5" : "grid-cols-7"
                )}>
                    {/* Day Headers */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-b border-r last:border-r-0 bg-muted/20">
                            {day}
                        </div>
                    ))}

                    {/* Calendar Grid */}
                    {days.map((day, dayIdx) => {
                        const dayEvents = events.filter(e => isSameDay(e.date, day));
                        const isToday = isSameDay(day, new Date());
                        const isCurrentMonth = isSameMonth(day, currentDate);

                        return (
                            <div
                                key={day.toString()}
                                className={cn(
                                    "min-h-[100px] p-2 border-b border-r last:border-r-0 relative group transition-colors hover:bg-muted/10",
                                    !isCurrentMonth && "bg-muted/5 text-muted-foreground",
                                    view === 'week' && "h-full min-h-[500px]"
                                )}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={cn(
                                        "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full",
                                        isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                                    )}>
                                        {format(day, 'd')}
                                    </span>
                                    {view === 'week' && isToday && (
                                        <Badge variant="outline" className="text-xs">Today</Badge>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    {dayEvents.map((event) => (
                                        <div
                                            key={event.id}
                                            className={cn(
                                                "w-full text-left text-xs p-1.5 rounded-md border mb-1 truncate flex items-center gap-1.5",
                                                event.color
                                            )}
                                        >
                                            <CheckSquare className="h-3 w-3 shrink-0" />
                                            <span className="truncate font-medium">{event.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
