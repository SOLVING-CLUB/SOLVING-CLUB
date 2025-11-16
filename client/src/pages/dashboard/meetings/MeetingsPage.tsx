import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { getSupabaseClient } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Video, Calendar, Users, Clock, Copy, ExternalLink } from 'lucide-react';
import { toast } from '@/lib/toast';
import { format } from 'date-fns';
import DashboardFrame from '@/components/dashboard-frame';

interface Meeting {
  id: string;
  title: string;
  description?: string;
  meeting_code: string;
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
  scheduled_at?: string;
  started_at?: string;
  host_id: string;
  project_id?: string;
  project_name?: string;
  participant_count?: number;
}

export default function MeetingsPage() {
  const [, setLocation] = useLocation();
  const supabase = getSupabaseClient();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          projects:project_id(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        // If table doesn't exist, show empty state
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.warn('Meetings table does not exist yet. Please run the database schema.');
          setMeetings([]);
          setLoading(false);
          return;
        }
        throw error;
      }

      if (data) {
        const formattedMeetings: Meeting[] = data.map((m: any) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          meeting_code: m.meeting_code,
          status: m.status,
          scheduled_at: m.scheduled_at,
          started_at: m.started_at,
          host_id: m.host_id,
          project_id: m.project_id,
          project_name: m.projects?.name || (m.projects as any)?.name,
          participant_count: 0, // Will be calculated separately if needed
        }));

        setMeetings(formattedMeetings);
      }
    } catch (error) {
      console.error('Error loading meetings:', error);
      toast.error('Error', 'Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const copyMeetingCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Copied!', 'Meeting code copied to clipboard');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'scheduled':
        return 'bg-blue-500';
      case 'ended':
        return 'bg-gray-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not scheduled';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  return (
    <DashboardFrame>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage video meetings with your team
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/meetings/create">
              <Plus className="h-4 w-4 mr-2" />
              New Meeting
            </Link>
          </Button>
        </div>

        {/* Meetings List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading meetings...</p>
          </div>
        ) : meetings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Video className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No meetings yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first meeting to start collaborating with your team
              </p>
              <Button asChild>
                <Link href="/dashboard/meetings/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Meeting
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meetings.map((meeting) => (
              <Card key={meeting.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{meeting.title}</CardTitle>
                    <Badge className={getStatusColor(meeting.status)}>
                      {meeting.status}
                    </Badge>
                  </div>
                  {meeting.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {meeting.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(meeting.scheduled_at)}</span>
                    </div>
                    {meeting.project_name && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{meeting.project_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{meeting.participant_count} participant{meeting.participant_count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Code: </span>
                      <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                        {meeting.meeting_code}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyMeetingCode(meeting.meeting_code)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {meeting.status === 'active' || meeting.status === 'scheduled' ? (
                      <Button
                        asChild
                        className="flex-1"
                        onClick={() => setLocation(`/dashboard/meetings/${meeting.id}`)}
                      >
                        <Link href={`/dashboard/meetings/${meeting.id}`}>
                          <Video className="h-4 w-4 mr-2" />
                          {meeting.status === 'active' ? 'Join' : 'Start'}
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="outline" className="flex-1" disabled>
                        Meeting Ended
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardFrame>
  );
}

