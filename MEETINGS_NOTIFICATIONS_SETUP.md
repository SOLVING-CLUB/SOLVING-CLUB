# Meetings & Notifications Setup Guide

This guide explains how to set up and use the meeting scheduler and notification system.

## Database Setup

1. **Run the database schema:**
   ```sql
   -- Execute the SQL file in your Supabase SQL editor
   supabase/meetings-notifications-schema.sql
   ```

   This creates:
   - `meetings` table - stores meeting information
   - `meeting_participants` table - tracks who's invited to meetings
   - `notifications` table - stores all notifications
   - Triggers to automatically create notifications when meetings are created or tasks are assigned

## Features

### 1. Meeting Scheduler
- **Location:** Project Detail Page → Meetings Tab
- **Features:**
  - Schedule meetings with date, time, and duration
  - Select specific team members to invite
  - Automatic Google Meet link generation
  - Real-time updates when meetings are created/updated

### 2. Task Assignment
- **Location:** Project Detail Page → Tasks Tab
- **Features:**
  - Assign tasks to specific team members
  - Automatic notifications sent to assigned members
  - Works when creating new tasks or editing existing ones

### 3. Notification Center
- **Location:** Sidebar (bell icon)
- **Features:**
  - View all notifications
  - Mark notifications as read
  - Delete notifications
  - Real-time updates
  - Unread count badge

## Mobile Push Notifications (Optional)

To enable push notifications on mobile devices:

1. **Install Capacitor Push Notifications:**
   ```bash
   npm install @capacitor/push-notifications
   ```

2. **Configure for iOS:**
   - Add push notification capability in Xcode
   - Configure APNs (Apple Push Notification service)

3. **Configure for Android:**
   - Set up Firebase Cloud Messaging (FCM)
   - Add FCM configuration to `android/app/google-services.json`

4. **The push notification service** (`client/src/lib/push-notifications.ts`) is already set up and will automatically initialize on native platforms.

## Google Meet Integration

Currently, the system generates placeholder Google Meet links. To integrate with actual Google Calendar API:

1. Set up Google Cloud Project
2. Enable Google Calendar API
3. Implement OAuth2 authentication
4. Use Google Calendar API to create events with Meet links

For now, the system generates random meet links that can be replaced with actual Google Calendar integration later.

## Notification Types

The system supports the following notification types:
- `meeting_invite` - When invited to a meeting
- `meeting_reminder` - Meeting reminder (can be extended)
- `task_assigned` - When a task is assigned to you
- `task_due` - Task due date reminder (can be extended)
- `task_updated` - When a task you're assigned to is updated
- `project_update` - General project updates (can be extended)

## Usage

### Scheduling a Meeting
1. Navigate to a project
2. Click on the "Meetings" tab
3. Click "Schedule Meeting"
4. Fill in meeting details
5. Select participants
6. Click "Create Meeting"

### Assigning a Task
1. Navigate to a project
2. Click on the "Tasks" tab
3. Create or edit a task
4. Select a team member from "Assign To" dropdown
5. Save the task

The assigned member will automatically receive a notification.

### Viewing Notifications
1. Click the bell icon in the sidebar
2. View all notifications
3. Mark as read or delete as needed

## Real-time Updates

All features use Supabase Realtime subscriptions, so changes appear instantly across all connected devices without page refresh.

