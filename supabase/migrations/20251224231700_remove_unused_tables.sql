-- Remove unused meeting-related tables
-- These tables are not used in the codebase
-- The codebase uses project_meetings and project_meeting_participants instead

-- Drop tables in reverse dependency order
drop table if exists public.meeting_recordings cascade;
drop table if exists public.meeting_messages cascade;
drop table if exists public.meeting_agenda_items cascade;
drop table if exists public.meeting_invitations cascade;
drop table if exists public.meeting_participants cascade;
drop table if exists public.meetings cascade;

