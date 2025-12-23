import UnifiedCalendar from "@/components/calendar/UnifiedCalendar";

export default function CalendarPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
                    <p className="text-muted-foreground">
                        View your project deadlines and tasks in one place.
                    </p>
                </div>
            </div>

            <UnifiedCalendar />
        </div>
    );
}
