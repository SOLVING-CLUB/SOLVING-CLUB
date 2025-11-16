import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { getSupabaseClient } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/lib/toast';
import { ArrowLeft, Calendar } from 'lucide-react';
import DashboardFrame from '@/components/dashboard-frame';
import { Link } from 'wouter';

export default function CreateMeetingPage() {
  const [location, setLocation] = useLocation();
  const supabase = getSupabaseClient();
  const [loading, setLoading] = useState(false);
  
  // Get project ID from URL query params
  const projectIdFromUrl = new URLSearchParams(window.location.search).get('project') || '';
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: projectIdFromUrl,
    scheduled_at: '',
    max_participants: 50,
    settings: {
      record: false,
      muteOnJoin: true,
      videoOnJoin: true,
      waitingRoom: false,
      allowScreenShare: true,
      allowChat: true,
    },
  });
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    loadProjects();
    if (projectIdFromUrl) {
      // Load project name for title suggestion
      supabase
        .from('projects')
        .select('name')
        .eq('id', projectIdFromUrl)
        .single()
        .then(({ data }) => {
          if (data && !formData.title) {
            setFormData(prev => ({ ...prev, title: `${data.name} Meeting` }));
          }
        });
    }
  }, [projectIdFromUrl]);

  const loadProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('owner_id', user.id)
        .order('name');

      if (error) throw error;
      if (data) {
        setProjects(data);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Error', 'Meeting title is required');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Error', 'You must be logged in');
        return;
      }

      // Prepare insert data - handle both meeting_date and scheduled_at for compatibility
      const insertData: any = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        host_id: user.id,
        organizer_id: user.id, // Also set organizer_id for compatibility with existing schema
        project_id: formData.project_id || null,
        scheduled_at: formData.scheduled_at || null,
        max_participants: formData.max_participants,
        settings: formData.settings,
      };
      
      // If scheduled_at is provided, also set meeting_date for compatibility with existing schema
      if (formData.scheduled_at) {
        insertData.meeting_date = formData.scheduled_at;
      } else {
        // Set meeting_date to current time if not provided (for NOT NULL constraint)
        insertData.meeting_date = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('meetings')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      toast.success('Success', 'Meeting created successfully!');
      setLocation(`/dashboard/meetings/${data.id}`);
    } catch (error: any) {
      console.error('Error creating meeting:', error);
      toast.error('Error', error.message || 'Failed to create meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardFrame>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/meetings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Meeting</h1>
            <p className="text-muted-foreground mt-1">
              Schedule a new video meeting with your team
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Meeting Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Team Standup"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Meeting agenda and notes..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project">Link to Project (Optional)</Label>
                <Select
                  value={formData.project_id || "none"}
                  onValueChange={(value) => setFormData({ ...formData, project_id: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduled_at">Scheduled Time (Optional)</Label>
                <Input
                  id="scheduled_at"
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_participants">Max Participants</Label>
                <Input
                  id="max_participants"
                  type="number"
                  min="2"
                  max="100"
                  value={formData.max_participants}
                  onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) || 50 })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Meeting Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="muteOnJoin"
                  checked={formData.settings.muteOnJoin}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      settings: { ...formData.settings, muteOnJoin: checked as boolean },
                    })
                  }
                />
                <Label htmlFor="muteOnJoin" className="cursor-pointer">
                  Mute participants on join
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="videoOnJoin"
                  checked={formData.settings.videoOnJoin}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      settings: { ...formData.settings, videoOnJoin: checked as boolean },
                    })
                  }
                />
                <Label htmlFor="videoOnJoin" className="cursor-pointer">
                  Enable video on join
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="waitingRoom"
                  checked={formData.settings.waitingRoom}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      settings: { ...formData.settings, waitingRoom: checked as boolean },
                    })
                  }
                />
                <Label htmlFor="waitingRoom" className="cursor-pointer">
                  Enable waiting room
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowScreenShare"
                  checked={formData.settings.allowScreenShare}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      settings: { ...formData.settings, allowScreenShare: checked as boolean },
                    })
                  }
                />
                <Label htmlFor="allowScreenShare" className="cursor-pointer">
                  Allow screen sharing
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowChat"
                  checked={formData.settings.allowChat}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      settings: { ...formData.settings, allowChat: checked as boolean },
                    })
                  }
                />
                <Label htmlFor="allowChat" className="cursor-pointer">
                  Enable chat
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="record"
                  checked={formData.settings.record}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      settings: { ...formData.settings, record: checked as boolean },
                    })
                  }
                />
                <Label htmlFor="record" className="cursor-pointer">
                  Record meeting (coming soon)
                </Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Meeting'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation('/dashboard/meetings')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </DashboardFrame>
  );
}

