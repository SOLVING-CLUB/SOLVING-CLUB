import { getSupabaseClient } from '@/lib/supabase';
import type {
  ProjectMeeting,
  ProjectMeetingWithParticipants,
  CreateMeetingInput,
  MeetingUpdateInput,
  ConflictResult,
} from '@/lib/types/meetings';
import { createNotificationsForUsers } from './notifications';

const supabase = getSupabaseClient();

export async function getProjectMeetings(projectId: string): Promise<ProjectMeetingWithParticipants[]> {
  const { data, error } = await supabase
    .from('project_meetings')
    .select(`
      *,
      participants:project_meeting_participants(*)
    `)
    .eq('project_id', projectId)
    .order('scheduled_at', { ascending: false });

  if (error) {
    console.error('Error fetching project meetings', error);
    throw error;
  }

  return (data as any[]).map((row) => ({
    ...(row as ProjectMeeting),
    participants:
      (row.participants || []).map((p: any) => ({
        id: p.id,
        meeting_id: p.meeting_id,
        user_id: p.user_id,
        role: p.role,
        created_at: p.created_at,
      })) ?? [],
  }));
}

export async function createProjectMeeting(input: CreateMeetingInput): Promise<ProjectMeetingWithParticipants> {
  const { scheduled_at, participant_ids, ...rest } = input;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('project_meetings')
    .insert({
      ...rest,
      project_id: input.project_id,
      scheduled_at: scheduled_at.toISOString(),
      duration_minutes: input.duration_minutes,
      notes: input.notes ?? null,
      created_by: user.id,
    })
    .select('*')
    .single();

  if (error || !data) {
    console.error('Error creating project meeting', error);
    throw error ?? new Error('Failed to create meeting');
  }

  if (participant_ids.length > 0) {
    const participantsPayload = participant_ids.map((pid) => ({
      meeting_id: data.id,
      user_id: pid,
      role: pid === user.id ? 'host' : 'participant',
    }));

    const { error: pError } = await supabase
      .from('project_meeting_participants')
      .insert(participantsPayload);

    if (pError) {
      console.error('Error creating meeting participants', pError);
      throw pError;
    }

    // Get project name for notification
    const { data: projectData } = await supabase
      .from('projects')
      .select('name')
      .eq('id', input.project_id)
      .single();

    const projectName = projectData?.name || 'the project';
    const scheduledDate = new Date(input.scheduled_at);
    const formattedDate = scheduledDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formattedTime = scheduledDate.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Send notifications to all participants (including the creator so they also get notified)
    // This ensures everyone in the meeting gets a notification
    if (participant_ids.length > 0) {
      try {
        console.log('Sending notifications to all participants:', participant_ids);
        console.log('Meeting details:', {
          title: input.title,
          projectName,
          scheduledDate: formattedDate,
          scheduledTime: formattedTime,
          meetingId: data.id
        });
        
        const notifications = await createNotificationsForUsers(participant_ids, {
          type: 'meeting_scheduled',
          title: 'New Meeting Scheduled',
          message: `You have been invited to "${input.title}" in ${projectName} on ${formattedDate} at ${formattedTime}.`,
          related_id: data.id,
          related_type: 'meeting',
        });
        
        console.log('✅ Notifications created successfully:', notifications.length);
        console.log('Notification IDs:', notifications.map(n => n.id));
      } catch (notifError: any) {
        // Log error but don't fail the meeting creation
        console.error('❌ Error sending notifications:', notifError);
        console.error('Error details:', {
          code: notifError?.code,
          message: notifError?.message,
          details: notifError?.details,
          hint: notifError?.hint,
        });
        console.error('Participant IDs to notify:', participant_ids);
        console.error('Current user ID:', user.id);
        console.error('Notification data:', {
          type: 'meeting_scheduled',
          title: 'New Meeting Scheduled',
          message: `You have been invited to "${input.title}" in ${projectName} on ${formattedDate} at ${formattedTime}.`,
          related_id: data.id,
          related_type: 'meeting',
        });
      }
    } else {
      console.log('⚠️ No participants to notify');
    }
  }

  const [withParticipants] = await getProjectMeetings(input.project_id);
  return withParticipants;
}

export async function updateProjectMeeting(meetingId: string, updates: MeetingUpdateInput): Promise<void> {
  const { scheduled_at, participant_ids, ...rest } = updates;

  const payload: any = { ...rest };
  if (scheduled_at) {
    payload.scheduled_at = scheduled_at.toISOString();
  }

  const { error } = await supabase
    .from('project_meetings')
    .update(payload)
    .eq('id', meetingId);

  if (error) {
    console.error('Error updating meeting', error);
    throw error;
  }

  if (participant_ids) {
    const { error: delError } = await supabase
      .from('project_meeting_participants')
      .delete()
      .eq('meeting_id', meetingId);
    if (delError) {
      console.error('Error clearing participants', delError);
      throw delError;
    }

    const { data: meeting } = await supabase
      .from('project_meetings')
      .select('project_id, created_by')
      .eq('id', meetingId)
      .single();

    const { data: { user } } = await supabase.auth.getUser();

    const participantsPayload = participant_ids.map((pid) => ({
      meeting_id: meetingId,
      user_id: pid,
      role: user && meeting && pid === user.id ? 'host' : 'participant',
    }));

    const { error: pError } = await supabase
      .from('project_meeting_participants')
      .insert(participantsPayload);

    if (pError) {
      console.error('Error updating participants', pError);
      throw pError;
    }
  }
}

export async function updateProjectMeetingNotes(meetingId: string, notes: string): Promise<void> {
  const { error } = await supabase
    .from('project_meetings')
    .update({ notes })
    .eq('id', meetingId);

  if (error) {
    console.error('Error updating meeting notes', error);
    throw error;
  }
}

export async function deleteProjectMeeting(meetingId: string): Promise<void> {
  const { error } = await supabase
    .from('project_meetings')
    .delete()
    .eq('id', meetingId);

  if (error) {
    console.error('Error deleting meeting', error);
    throw error;
  }
}

export async function getMeetingConflicts(
  projectId: string,
  participantIds: string[],
  scheduledAt: Date,
  durationMinutes: number,
): Promise<ConflictResult[]> {
  if (participantIds.length === 0) return [];

  const newStart = scheduledAt.toISOString();
  const newEnd = new Date(scheduledAt.getTime() + durationMinutes * 60_000).toISOString();

  const { data, error } = await supabase.rpc('get_meeting_conflicts', {
    p_project_id: projectId,
    p_participant_ids: participantIds,
    p_start: newStart,
    p_end: newEnd,
  });

  if (error) {
    console.error('Error checking meeting conflicts', error);
    throw error;
  }

  return (data || []) as ConflictResult[];
}


