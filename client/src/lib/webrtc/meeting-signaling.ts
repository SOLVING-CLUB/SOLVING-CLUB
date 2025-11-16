import { getSupabaseClient } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface WebRTCSignal {
  meetingId: string;
  fromUserId: string;
  toUserId: string;
  signal: any; // SDP offer/answer or ICE candidate
  signalType: 'offer' | 'answer' | 'ice-candidate';
}

export interface ParticipantInfo {
  userId: string;
  joinedAt: string;
  role: 'host' | 'co-host' | 'participant';
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  handRaised: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}

export class MeetingSignaling {
  private supabase = getSupabaseClient();
  private channel: RealtimeChannel | null = null;
  private meetingId: string | null = null;
  private userId: string | null = null;
  private onSignalCallback: ((signal: WebRTCSignal) => void) | null = null;
  private onParticipantChangeCallback: ((participants: ParticipantInfo[]) => void) | null = null;
  private onMessageCallback: ((message: any) => void) | null = null;

  /**
   * Join the signaling channel for a meeting
   */
  async joinMeeting(meetingId: string, userId: string) {
    this.meetingId = meetingId;
    this.userId = userId;

    // Leave existing channel if any
    if (this.channel) {
      await this.leaveMeeting();
    }

    // Create new channel
    this.channel = this.supabase
      .channel(`meeting-${meetingId}`, {
        config: {
          broadcast: { self: false }, // Don't receive our own broadcasts
        },
      })
      .on('broadcast', { event: 'webrtc-signal' }, (payload) => {
        const signal = payload.payload as WebRTCSignal;
        // Only process signals intended for us
        if (signal.toUserId === userId && this.onSignalCallback) {
          this.onSignalCallback(signal);
        }
      })
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'meeting_participants',
          filter: `meeting_id=eq.${meetingId}`
        }, 
        (payload) => {
          this.loadParticipants();
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meeting_messages',
          filter: `meeting_id=eq.${meetingId}`
        },
        (payload) => {
          if (this.onMessageCallback) {
            this.onMessageCallback(payload);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Connected to meeting signaling channel');
          this.loadParticipants();
        }
      });

    return this.channel;
  }

  /**
   * Load current participants from database
   */
  private async loadParticipants() {
    if (!this.meetingId) return;

    const { data, error } = await this.supabase
      .from('meeting_participants')
      .select('*')
      .eq('meeting_id', this.meetingId)
      .is('left_at', null)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('Error loading participants:', error);
      return;
    }

    if (data && this.onParticipantChangeCallback) {
      const participants: ParticipantInfo[] = data.map((p: any) => ({
        userId: p.user_id,
        joinedAt: p.joined_at,
        role: p.role,
        audioEnabled: p.audio_enabled,
        videoEnabled: p.video_enabled,
        screenSharing: p.screen_sharing,
        handRaised: p.hand_raised,
        connectionStatus: p.connection_status,
      }));
      this.onParticipantChangeCallback(participants);
    }
  }

  /**
   * Send WebRTC signal (offer, answer, or ICE candidate)
   */
  sendSignal(toUserId: string, signal: any, signalType: 'offer' | 'answer' | 'ice-candidate') {
    if (!this.channel || !this.meetingId || !this.userId) {
      console.error('Not connected to meeting');
      return;
    }

    const payload: WebRTCSignal = {
      meetingId: this.meetingId,
      fromUserId: this.userId,
      toUserId,
      signal,
      signalType,
    };

    this.channel.send({
      type: 'broadcast',
      event: 'webrtc-signal',
      payload,
    });
  }

  /**
   * Broadcast to all participants (for group signals)
   */
  broadcastToAll(signal: any, signalType: 'offer' | 'answer' | 'ice-candidate') {
    if (!this.channel || !this.meetingId || !this.userId) {
      console.error('Not connected to meeting');
      return;
    }

    // Send to all by using a special 'all' identifier
    const payload: WebRTCSignal = {
      meetingId: this.meetingId,
      fromUserId: this.userId,
      toUserId: 'all',
      signal,
      signalType,
    };

    this.channel.send({
      type: 'broadcast',
      event: 'webrtc-signal',
      payload,
    });
  }

  /**
   * Set callback for incoming WebRTC signals
   */
  onSignal(callback: (signal: WebRTCSignal) => void) {
    this.onSignalCallback = callback;
  }

  /**
   * Set callback for participant changes
   */
  onParticipantChange(callback: (participants: ParticipantInfo[]) => void) {
    this.onParticipantChangeCallback = callback;
  }

  /**
   * Set callback for meeting messages
   */
  onMessage(callback: (message: any) => void) {
    this.onMessageCallback = callback;
  }

  /**
   * Leave the meeting and cleanup
   */
  async leaveMeeting() {
    if (this.channel) {
      await this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.meetingId = null;
    this.userId = null;
    this.onSignalCallback = null;
    this.onParticipantChangeCallback = null;
    this.onMessageCallback = null;
  }
}

