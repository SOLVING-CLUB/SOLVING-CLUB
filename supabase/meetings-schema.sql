-- =====================================================
-- MEETINGS & WEBRTC SCHEMA
-- =====================================================
-- This schema supports real-time video meetings using WebRTC
-- with Supabase Realtime for signaling

-- Meetings table
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  host_id UUID NOT NULL,
  project_id UUID,
  meeting_code TEXT UNIQUE NOT NULL, -- 6-8 digit code for easy joining
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'ended', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  max_participants INTEGER DEFAULT 50,
  settings JSONB DEFAULT '{
    "record": false,
    "muteOnJoin": true,
    "videoOnJoin": true,
    "waitingRoom": false,
    "allowScreenShare": true,
    "allowChat": true
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist (in case table was created without them)
DO $$ 
BEGIN
  -- Handle organizer_id -> host_id migration (use organizer_id if it exists, otherwise add host_id)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meetings' 
    AND column_name = 'organizer_id'
  ) THEN
    -- If organizer_id is NOT NULL, make it nullable or ensure host_id is set
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'meetings' 
      AND column_name = 'organizer_id'
      AND is_nullable = 'NO'
    ) THEN
      -- Make organizer_id nullable to allow flexibility
      ALTER TABLE public.meetings ALTER COLUMN organizer_id DROP NOT NULL;
    END IF;
    
    -- If organizer_id exists but host_id doesn't, add host_id and copy data
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'meetings' 
      AND column_name = 'host_id'
    ) THEN
      ALTER TABLE public.meetings ADD COLUMN host_id UUID;
      UPDATE public.meetings SET host_id = organizer_id WHERE host_id IS NULL;
      ALTER TABLE public.meetings ALTER COLUMN host_id SET NOT NULL;
    END IF;
  ELSE
    -- No organizer_id, add host_id if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'meetings' 
      AND column_name = 'host_id'
    ) THEN
      -- Check if table has any rows
      IF EXISTS (SELECT 1 FROM public.meetings LIMIT 1) THEN
        -- Table has rows, add as nullable first, then update, then make NOT NULL
        ALTER TABLE public.meetings ADD COLUMN host_id UUID;
        -- Set a default value for existing rows (use first user if available)
        UPDATE public.meetings 
        SET host_id = COALESCE(
          (SELECT id FROM auth.users LIMIT 1),
          gen_random_uuid()
        ) 
        WHERE host_id IS NULL;
        ALTER TABLE public.meetings ALTER COLUMN host_id SET NOT NULL;
      ELSE
        -- Table is empty, can add as NOT NULL directly
        ALTER TABLE public.meetings ADD COLUMN host_id UUID NOT NULL;
      END IF;
    END IF;
  END IF;

  -- Add other columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meetings' 
    AND column_name = 'project_id'
  ) THEN
    ALTER TABLE public.meetings ADD COLUMN project_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meetings' 
    AND column_name = 'meeting_code'
  ) THEN
    ALTER TABLE public.meetings ADD COLUMN meeting_code TEXT UNIQUE NOT NULL DEFAULT upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
  END IF;

  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meetings' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.meetings ADD COLUMN status TEXT DEFAULT 'scheduled';
  END IF;

  -- Handle meeting_date column (existing table might have this)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meetings' 
    AND column_name = 'meeting_date'
  ) THEN
    -- Check if meeting_date is NOT NULL and make it nullable if needed
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'meetings' 
      AND column_name = 'meeting_date'
      AND is_nullable = 'NO'
    ) THEN
      -- Make it nullable
      ALTER TABLE public.meetings ALTER COLUMN meeting_date DROP NOT NULL;
      -- Set default for existing NULL values
      UPDATE public.meetings SET meeting_date = NOW() WHERE meeting_date IS NULL;
    END IF;
    
    -- If scheduled_at doesn't exist, add it and copy from meeting_date
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'meetings' 
      AND column_name = 'scheduled_at'
    ) THEN
      ALTER TABLE public.meetings ADD COLUMN scheduled_at TIMESTAMPTZ;
      UPDATE public.meetings SET scheduled_at = meeting_date::timestamptz WHERE scheduled_at IS NULL;
    END IF;
  END IF;

  -- Handle date -> scheduled_at migration
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meetings' 
    AND column_name = 'date'
  ) THEN
    -- If date exists but scheduled_at doesn't, add scheduled_at and copy data
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'meetings' 
      AND column_name = 'scheduled_at'
    ) THEN
      ALTER TABLE public.meetings ADD COLUMN scheduled_at TIMESTAMPTZ;
      UPDATE public.meetings SET scheduled_at = date::timestamptz WHERE scheduled_at IS NULL;
    END IF;
  ELSE
    -- No date column, add scheduled_at if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'meetings' 
      AND column_name = 'scheduled_at'
    ) THEN
      ALTER TABLE public.meetings ADD COLUMN scheduled_at TIMESTAMPTZ;
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meetings' 
    AND column_name = 'started_at'
  ) THEN
    ALTER TABLE public.meetings ADD COLUMN started_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meetings' 
    AND column_name = 'ended_at'
  ) THEN
    ALTER TABLE public.meetings ADD COLUMN ended_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meetings' 
    AND column_name = 'max_participants'
  ) THEN
    ALTER TABLE public.meetings ADD COLUMN max_participants INTEGER DEFAULT 50;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meetings' 
    AND column_name = 'settings'
  ) THEN
    ALTER TABLE public.meetings ADD COLUMN settings JSONB DEFAULT '{
      "record": false,
      "muteOnJoin": true,
      "videoOnJoin": true,
      "waitingRoom": false,
      "allowScreenShare": true,
      "allowChat": true
    }'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meetings' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.meetings ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meetings' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.meetings ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Add status check constraint separately (after column exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meetings' 
    AND column_name = 'status'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'meetings_status_check'
  ) THEN
    ALTER TABLE public.meetings ADD CONSTRAINT meetings_status_check 
    CHECK (status IN ('scheduled', 'active', 'ended', 'cancelled'));
  END IF;
END $$;

-- Add foreign key constraints separately (safer)
DO $$ 
BEGIN
  -- Check if host_id column exists before adding foreign key
  -- Also handle organizer_id if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meetings' 
    AND column_name = 'host_id'
  ) THEN
    -- Add host_id foreign key if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'meetings_host_id_fkey'
    ) THEN
      ALTER TABLE public.meetings 
      ADD CONSTRAINT meetings_host_id_fkey 
      FOREIGN KEY (host_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END IF;
  
  -- Also ensure organizer_id has foreign key if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meetings' 
    AND column_name = 'organizer_id'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'meetings_organizer_id_fkey'
    ) THEN
      ALTER TABLE public.meetings 
      ADD CONSTRAINT meetings_organizer_id_fkey 
      FOREIGN KEY (organizer_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END IF;

  -- Add project_id foreign key if it doesn't exist and projects table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meetings' 
    AND column_name = 'project_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'projects'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'meetings_project_id_fkey'
    ) THEN
      ALTER TABLE public.meetings 
      ADD CONSTRAINT meetings_project_id_fkey 
      FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Meeting participants
CREATE TABLE IF NOT EXISTS public.meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  role TEXT DEFAULT 'participant' CHECK (role IN ('host', 'co-host', 'participant')),
  audio_enabled BOOLEAN DEFAULT true,
  video_enabled BOOLEAN DEFAULT true,
  screen_sharing BOOLEAN DEFAULT false,
  hand_raised BOOLEAN DEFAULT false,
  connection_status TEXT DEFAULT 'connecting' CHECK (connection_status IN ('connecting', 'connected', 'disconnected')),
  UNIQUE(meeting_id, user_id)
);

-- Ensure all columns exist for meeting_participants
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meeting_participants' 
    AND column_name = 'connection_status'
  ) THEN
    ALTER TABLE public.meeting_participants ADD COLUMN connection_status TEXT DEFAULT 'connecting';
  END IF;
  
  -- Add connection_status check constraint if column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meeting_participants' 
    AND column_name = 'connection_status'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'meeting_participants_connection_status_check'
  ) THEN
    ALTER TABLE public.meeting_participants ADD CONSTRAINT meeting_participants_connection_status_check 
    CHECK (connection_status IN ('connecting', 'connected', 'disconnected'));
  END IF;

  -- Add other columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meeting_participants' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.meeting_participants ADD COLUMN role TEXT DEFAULT 'participant';
  END IF;
  
  -- Add role check constraint if column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meeting_participants' 
    AND column_name = 'role'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'meeting_participants_role_check'
  ) THEN
    ALTER TABLE public.meeting_participants ADD CONSTRAINT meeting_participants_role_check 
    CHECK (role IN ('host', 'co-host', 'participant'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meeting_participants' 
    AND column_name = 'audio_enabled'
  ) THEN
    ALTER TABLE public.meeting_participants ADD COLUMN audio_enabled BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meeting_participants' 
    AND column_name = 'video_enabled'
  ) THEN
    ALTER TABLE public.meeting_participants ADD COLUMN video_enabled BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meeting_participants' 
    AND column_name = 'screen_sharing'
  ) THEN
    ALTER TABLE public.meeting_participants ADD COLUMN screen_sharing BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meeting_participants' 
    AND column_name = 'hand_raised'
  ) THEN
    ALTER TABLE public.meeting_participants ADD COLUMN hand_raised BOOLEAN DEFAULT false;
  END IF;

  -- Ensure left_at column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meeting_participants' 
    AND column_name = 'left_at'
  ) THEN
    ALTER TABLE public.meeting_participants ADD COLUMN left_at TIMESTAMPTZ;
  END IF;

  -- Ensure joined_at column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meeting_participants' 
    AND column_name = 'joined_at'
  ) THEN
    ALTER TABLE public.meeting_participants ADD COLUMN joined_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Add foreign key constraints for meeting_participants
DO $$ 
BEGIN
  -- Check if table and columns exist
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'meeting_participants'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'meeting_participants' 
      AND column_name = 'meeting_id'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'meetings'
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'meeting_participants_meeting_id_fkey'
      ) THEN
        ALTER TABLE public.meeting_participants 
        ADD CONSTRAINT meeting_participants_meeting_id_fkey 
        FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;
      END IF;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'meeting_participants' 
      AND column_name = 'user_id'
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'meeting_participants_user_id_fkey'
      ) THEN
        ALTER TABLE public.meeting_participants 
        ADD CONSTRAINT meeting_participants_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
      END IF;
    END IF;
  END IF;
END $$;

-- Meeting recordings (optional feature)
CREATE TABLE IF NOT EXISTS public.meeting_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL,
  file_url TEXT,
  file_size BIGINT, -- bytes
  duration INTEGER, -- seconds
  recorded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints for meeting_recordings
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'meeting_recordings'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'meeting_recordings' 
      AND column_name = 'meeting_id'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'meetings'
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'meeting_recordings_meeting_id_fkey'
      ) THEN
        ALTER TABLE public.meeting_recordings 
        ADD CONSTRAINT meeting_recordings_meeting_id_fkey 
        FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;
      END IF;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'meeting_recordings' 
      AND column_name = 'recorded_by'
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'meeting_recordings_recorded_by_fkey'
      ) THEN
        ALTER TABLE public.meeting_recordings 
        ADD CONSTRAINT meeting_recordings_recorded_by_fkey 
        FOREIGN KEY (recorded_by) REFERENCES auth.users(id) ON DELETE SET NULL;
      END IF;
    END IF;
  END IF;
END $$;

-- Meeting chat messages (in-meeting chat)
CREATE TABLE IF NOT EXISTS public.meeting_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'file')),
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints for meeting_messages
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'meeting_messages'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'meeting_messages' 
      AND column_name = 'meeting_id'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'meetings'
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'meeting_messages_meeting_id_fkey'
      ) THEN
        ALTER TABLE public.meeting_messages 
        ADD CONSTRAINT meeting_messages_meeting_id_fkey 
        FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;
      END IF;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'meeting_messages' 
      AND column_name = 'user_id'
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'meeting_messages_user_id_fkey'
      ) THEN
        ALTER TABLE public.meeting_messages 
        ADD CONSTRAINT meeting_messages_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
      END IF;
    END IF;
  END IF;
END $$;

-- Meeting invitations
CREATE TABLE IF NOT EXISTS public.meeting_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL,
  invited_user_id UUID,
  invited_email TEXT, -- For external invites
  invited_by UUID NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- Add foreign key constraints for meeting_invitations
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'meeting_invitations'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'meeting_invitations' 
      AND column_name = 'meeting_id'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'meetings'
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'meeting_invitations_meeting_id_fkey'
      ) THEN
        ALTER TABLE public.meeting_invitations 
        ADD CONSTRAINT meeting_invitations_meeting_id_fkey 
        FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;
      END IF;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'meeting_invitations' 
      AND column_name = 'invited_user_id'
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'meeting_invitations_invited_user_id_fkey'
      ) THEN
        ALTER TABLE public.meeting_invitations 
        ADD CONSTRAINT meeting_invitations_invited_user_id_fkey 
        FOREIGN KEY (invited_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
      END IF;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'meeting_invitations' 
      AND column_name = 'invited_by'
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'meeting_invitations_invited_by_fkey'
      ) THEN
        ALTER TABLE public.meeting_invitations 
        ADD CONSTRAINT meeting_invitations_invited_by_fkey 
        FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE CASCADE;
      END IF;
    END IF;
  END IF;
END $$;

-- Indexes for performance (only create if columns exist)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meetings' 
    AND column_name = 'project_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_meetings_project ON public.meetings(project_id);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meetings' 
    AND column_name = 'host_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_meetings_host ON public.meetings(host_id);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meetings' 
    AND column_name = 'meeting_code'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_meetings_code ON public.meetings(meeting_code);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meetings' 
    AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_meetings_status ON public.meetings(status);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meetings' 
    AND column_name = 'scheduled_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_meetings_scheduled ON public.meetings(scheduled_at);
  END IF;
END $$;

-- Indexes for meeting_participants (only create if columns exist)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meeting_participants' 
    AND column_name = 'meeting_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_participants_meeting ON public.meeting_participants(meeting_id);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meeting_participants' 
    AND column_name = 'user_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_participants_user ON public.meeting_participants(user_id);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meeting_participants' 
    AND column_name = 'connection_status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_participants_status ON public.meeting_participants(connection_status);
  END IF;
END $$;

-- Indexes for other tables (only create if columns exist)
DO $$ 
BEGIN
  -- meeting_recordings indexes
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meeting_recordings' 
    AND column_name = 'meeting_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_recordings_meeting ON public.meeting_recordings(meeting_id);
  END IF;

  -- meeting_messages indexes
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meeting_messages' 
    AND column_name = 'meeting_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_messages_meeting ON public.meeting_messages(meeting_id);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meeting_messages' 
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_messages_created ON public.meeting_messages(created_at);
  END IF;

  -- meeting_invitations indexes
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meeting_invitations' 
    AND column_name = 'meeting_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_invitations_meeting ON public.meeting_invitations(meeting_id);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meeting_invitations' 
    AND column_name = 'invited_user_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_invitations_user ON public.meeting_invitations(invited_user_id);
  END IF;
END $$;

-- Triggers for updated_at (only if function exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'set_updated_at' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    DROP TRIGGER IF EXISTS meetings_set_updated_at ON public.meetings;
    CREATE TRIGGER meetings_set_updated_at
    BEFORE UPDATE ON public.meetings
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- Function to generate unique meeting code
CREATE OR REPLACE FUNCTION generate_meeting_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-digit alphanumeric code
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM public.meetings WHERE meeting_code = code) INTO exists_check;
    EXIT WHEN NOT exists_check;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically set meeting code
CREATE OR REPLACE FUNCTION set_meeting_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.meeting_code IS NULL OR NEW.meeting_code = '' THEN
    NEW.meeting_code := generate_meeting_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_meeting_code_trigger ON public.meetings;
CREATE TRIGGER set_meeting_code_trigger
BEFORE INSERT ON public.meetings
FOR EACH ROW
EXECUTE FUNCTION set_meeting_code();

-- Function to update meeting status based on participants
CREATE OR REPLACE FUNCTION update_meeting_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if required columns exist before using them
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meetings' 
    AND column_name = 'status'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meeting_participants' 
    AND column_name = 'left_at'
  ) THEN
    -- If first participant joins, set status to active
    IF TG_OP = 'INSERT' AND NEW.left_at IS NULL THEN
      UPDATE public.meetings
      SET status = 'active', started_at = COALESCE(started_at, NOW())
      WHERE id = NEW.meeting_id 
      AND (status = 'scheduled' OR status IS NULL);
    END IF;
    
    -- If all participants left, set status to ended
    IF TG_OP = 'UPDATE' AND NEW.left_at IS NOT NULL AND OLD.left_at IS NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.meeting_participants 
        WHERE meeting_id = NEW.meeting_id AND left_at IS NULL
      ) THEN
        UPDATE public.meetings
        SET status = 'ended', ended_at = NOW()
        WHERE id = NEW.meeting_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_meeting_status_trigger ON public.meeting_participants;
CREATE TRIGGER update_meeting_status_trigger
AFTER INSERT OR UPDATE ON public.meeting_participants
FOR EACH ROW
EXECUTE FUNCTION update_meeting_status();

-- Security definer function to check if user is a participant (bypasses RLS to avoid recursion)
-- This function runs with the privileges of the function owner, bypassing RLS
CREATE OR REPLACE FUNCTION is_meeting_participant(meeting_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
#variable_conflict use_variable
DECLARE
  result BOOLEAN;
BEGIN
  -- Query with SECURITY DEFINER bypasses RLS
  SELECT EXISTS (
    SELECT 1 FROM public.meeting_participants 
    WHERE meeting_id = meeting_uuid AND user_id = user_uuid
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Security definer function to check if user is invited (bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION is_meeting_invited(meeting_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
#variable_conflict use_variable
DECLARE
  result BOOLEAN;
BEGIN
  -- Query with SECURITY DEFINER bypasses RLS
  SELECT EXISTS (
    SELECT 1 FROM public.meeting_invitations 
    WHERE meeting_id = meeting_uuid AND invited_user_id = user_uuid
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_invitations ENABLE ROW LEVEL SECURITY;

-- Meetings: Users can view meetings they're part of or created
-- Use security definer functions to avoid RLS recursion
DROP POLICY IF EXISTS "Users can view meetings they're in" ON public.meetings;
CREATE POLICY "Users can view meetings they're in" ON public.meetings
  FOR SELECT
  USING (
    host_id = auth.uid() OR
    is_meeting_invited(id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can create meetings" ON public.meetings;
CREATE POLICY "Users can create meetings" ON public.meetings
  FOR INSERT
  WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can update their meetings" ON public.meetings;
CREATE POLICY "Hosts can update their meetings" ON public.meetings
  FOR UPDATE
  USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can delete their meetings" ON public.meetings;
CREATE POLICY "Hosts can delete their meetings" ON public.meetings
  FOR DELETE
  USING (auth.uid() = host_id);

-- Participants: Users can view participants of meetings they're in
-- Non-recursive - use security definer function or only check direct fields
DROP POLICY IF EXISTS "Users can view participants" ON public.meeting_participants;
CREATE POLICY "Users can view participants" ON public.meeting_participants
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    meeting_id IN (
      SELECT id FROM public.meetings WHERE host_id = auth.uid()
    ) OR
    meeting_id IN (
      SELECT meeting_id FROM public.meeting_invitations 
      WHERE invited_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can join meetings" ON public.meeting_participants;
CREATE POLICY "Users can join meetings" ON public.meeting_participants
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own participation" ON public.meeting_participants;
CREATE POLICY "Users can update their own participation" ON public.meeting_participants
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Recordings: Users can view recordings of meetings they were in
-- Non-recursive - only check host directly
DROP POLICY IF EXISTS "Users can view recordings" ON public.meeting_recordings;
CREATE POLICY "Users can view recordings" ON public.meeting_recordings
  FOR SELECT
  USING (
    meeting_id IN (
      SELECT id FROM public.meetings WHERE host_id = auth.uid()
    ) OR
    meeting_id IN (
      SELECT meeting_id FROM public.meeting_invitations 
      WHERE invited_user_id = auth.uid()
    )
  );

-- Messages: Users can view messages from meetings they're in
-- Non-recursive - only check host and invitations directly
DROP POLICY IF EXISTS "Users can view meeting messages" ON public.meeting_messages;
CREATE POLICY "Users can view meeting messages" ON public.meeting_messages
  FOR SELECT
  USING (
    meeting_id IN (
      SELECT id FROM public.meetings WHERE host_id = auth.uid()
    ) OR
    meeting_id IN (
      SELECT meeting_id FROM public.meeting_invitations 
      WHERE invited_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can send meeting messages" ON public.meeting_messages;
-- Non-recursive - only check host and invitations directly
CREATE POLICY "Users can send meeting messages" ON public.meeting_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    (
      meeting_id IN (
        SELECT id FROM public.meetings WHERE host_id = auth.uid()
      ) OR
      meeting_id IN (
        SELECT meeting_id FROM public.meeting_invitations 
        WHERE invited_user_id = auth.uid()
      )
    )
  );

-- Invitations: Users can view their invitations
-- Simplified to avoid recursion - only check direct fields, no meetings query
DROP POLICY IF EXISTS "Users can view their invitations" ON public.meeting_invitations;
CREATE POLICY "Users can view their invitations" ON public.meeting_invitations
  FOR SELECT
  USING (
    invited_user_id = auth.uid() OR
    invited_by = auth.uid()
  );

DROP POLICY IF EXISTS "Users can create invitations" ON public.meeting_invitations;
CREATE POLICY "Users can create invitations" ON public.meeting_invitations
  FOR INSERT
  WITH CHECK (invited_by = auth.uid());

DROP POLICY IF EXISTS "Users can respond to invitations" ON public.meeting_invitations;
CREATE POLICY "Users can respond to invitations" ON public.meeting_invitations
  FOR UPDATE
  USING (invited_user_id = auth.uid());

-- Enable Realtime for WebRTC signaling
DO $$ 
BEGIN
  -- Add meeting_participants to publication if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'meeting_participants' 
    AND schemaname = 'public'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_participants;
  END IF;

  -- Add meeting_messages to publication if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'meeting_messages' 
    AND schemaname = 'public'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_messages;
  END IF;
END $$;

