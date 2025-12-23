export interface ProjectMeeting {
  id: string;
  project_id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_link: string;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMeetingParticipant {
  id: string;
  meeting_id: string;
  user_id: string;
  role: 'host' | 'participant';
  created_at: string;
  user?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface ProjectMeetingWithParticipants extends ProjectMeeting {
  participants: ProjectMeetingParticipant[];
}

export interface CreateMeetingInput {
  project_id: string;
  title: string;
  scheduled_at: Date;
  duration_minutes: number;
  meeting_link: string;
  notes?: string;
  participant_ids: string[]; // user_ids
}

export interface MeetingUpdateInput {
  title?: string;
  scheduled_at?: Date;
  duration_minutes?: number;
  meeting_link?: string;
  notes?: string | null;
  participant_ids?: string[];
}

export interface ConflictResult {
  participant_id: string;
  participant_name: string;
  meeting_id: string;
  meeting_title: string;
  scheduled_at: string;
  duration_minutes: number;
}


