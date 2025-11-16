import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import { getSupabaseClient } from '@/lib/supabase';
import { MeetingSignaling } from '@/lib/webrtc/meeting-signaling';
import { PeerManager } from '@/lib/webrtc/peer-manager';
import VideoParticipant from '@/components/meetings/VideoParticipant';
import MeetingControls from '@/components/meetings/MeetingControls';
import ParticipantList, { Participant } from '@/components/meetings/ParticipantList';
import MeetingChat from '@/components/meetings/MeetingChat';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/lib/toast';
import { X } from 'lucide-react';
import { stopStream } from '@/lib/webrtc/media-handler';

interface MeetingInfo {
  id: string;
  title: string;
  host_id: string;
  settings: any;
}

export default function MeetingRoomPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const meetingId = params.id;
  const supabase = getSupabaseClient();

  const [meetingInfo, setMeetingInfo] = useState<MeetingInfo | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Media state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);

  // UI state
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarView, setSidebarView] = useState<'participants' | 'chat'>('participants');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Refs
  const signalingRef = useRef<MeetingSignaling | null>(null);
  const peerManagerRef = useRef<PeerManager | null>(null);
  const participantProfilesRef = useRef<Map<string, { name: string; avatarUrl?: string }>>(new Map());

  // Initialize meeting
  useEffect(() => {
    if (!meetingId) return;

    const initializeMeeting = async () => {
      try {
        setLoading(true);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('You must be logged in');
          return;
        }
        setCurrentUserId(user.id);

        // Load meeting info
        const { data: meeting, error: meetingError } = await supabase
          .from('meetings')
          .select('*')
          .eq('id', meetingId)
          .single();

        if (meetingError) throw meetingError;
        if (!meeting) {
          setError('Meeting not found');
          return;
        }

        setMeetingInfo(meeting);

        // Check if meeting is active or can be started
        if (meeting.status === 'ended' || meeting.status === 'cancelled') {
          setError('This meeting has ended');
          return;
        }

        // Join as participant
        const { error: joinError } = await supabase
          .from('meeting_participants')
          .upsert({
            meeting_id: meetingId,
            user_id: user.id,
            role: meeting.host_id === user.id ? 'host' : 'participant',
            left_at: null,
            connection_status: 'connecting',
          }, {
            onConflict: 'meeting_id,user_id',
          });

        if (joinError) throw joinError;

        // Initialize WebRTC
        const signaling = new MeetingSignaling();
        const peerManager = new PeerManager(signaling);

        signalingRef.current = signaling;
        peerManagerRef.current = peerManager;

        peerManager.initialize(meetingId, user.id);

        // Setup peer manager callbacks
        peerManager.onStream((userId, stream, isLocal) => {
          if (isLocal) {
            setLocalStream(stream);
          } else {
            setRemoteStreams((prev) => {
              const newMap = new Map(prev);
              newMap.set(userId, stream);
              return newMap;
            });
          }
        });

        peerManager.onStreamEnd((userId) => {
          setRemoteStreams((prev) => {
            const newMap = new Map(prev);
            newMap.delete(userId);
            return newMap;
          });
        });

        // Setup signaling
        await signaling.joinMeeting(meetingId, user.id);

        signaling.onParticipantChange(async (participantInfos) => {
          // Load participant profiles
          const userIds = participantInfos.map(p => p.userId);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds);

          const profilesMap = new Map<string, { name: string; avatarUrl?: string }>();
          profiles?.forEach((p: any) => {
            profilesMap.set(p.id, {
              name: p.full_name || 'Unknown',
              avatarUrl: p.avatar_url,
            });
          });

          participantProfilesRef.current = profilesMap;

          // Format participants
          const formattedParticipants: Participant[] = participantInfos.map((p) => {
            const profile = profilesMap.get(p.userId);
            return {
              userId: p.userId,
              name: profile?.name || 'Unknown',
              avatarUrl: profile?.avatarUrl,
              role: p.role,
              audioEnabled: p.audioEnabled,
              videoEnabled: p.videoEnabled,
              screenSharing: p.screenSharing,
              handRaised: p.handRaised,
              connectionStatus: p.connectionStatus,
              joinedAt: p.joinedAt,
            };
          });

          setParticipants(formattedParticipants);

          // Create peer connections for new participants
          const existingPeerIds = peerManager.getPeerIds();
          participantInfos.forEach((p) => {
            if (p.userId !== user.id && !existingPeerIds.includes(p.userId)) {
              // Determine if we should be initiator (if we joined first)
              const isInitiator = existingPeerIds.length === 0;
              peerManager.createPeer(p.userId, isInitiator);
            }
          });
        });

        // Request media permissions and start local stream
        const stream = await peerManager.initializeLocalStream(
          meeting.settings?.muteOnJoin !== false,
          meeting.settings?.videoOnJoin !== false
        );

        setAudioEnabled(meeting.settings?.muteOnJoin !== false);
        setVideoEnabled(meeting.settings?.videoOnJoin !== false);

        // Update participant status
        await supabase
          .from('meeting_participants')
          .update({ connection_status: 'connected' })
          .eq('meeting_id', meetingId)
          .eq('user_id', user.id);

      } catch (err: any) {
        console.error('Error initializing meeting:', err);
        setError(err.message || 'Failed to join meeting');
        toast.error('Error', err.message || 'Failed to join meeting');
      } finally {
        setLoading(false);
      }
    };

    initializeMeeting();

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [meetingId]);

  const cleanup = async () => {
    if (currentUserId && meetingId) {
      // Mark as left
      await supabase
        .from('meeting_participants')
        .update({ left_at: new Date().toISOString(), connection_status: 'disconnected' })
        .eq('meeting_id', meetingId)
        .eq('user_id', currentUserId);
    }

    // Stop all streams
    stopStream(localStream);
    remoteStreams.forEach(stream => stopStream(stream));

    // Cleanup WebRTC
    peerManagerRef.current?.cleanup();
    signalingRef.current?.leaveMeeting();

    setLocalStream(null);
    setRemoteStreams(new Map());
  };

  const handleToggleAudio = useCallback(() => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    peerManagerRef.current?.toggleAudio(newState);

    // Update in database
    if (currentUserId && meetingId) {
      supabase
        .from('meeting_participants')
        .update({ audio_enabled: newState })
        .eq('meeting_id', meetingId)
        .eq('user_id', currentUserId);
    }
  }, [audioEnabled, currentUserId, meetingId]);

  const handleToggleVideo = useCallback(() => {
    const newState = !videoEnabled;
    setVideoEnabled(newState);
    peerManagerRef.current?.toggleVideo(newState);

    // Update in database
    if (currentUserId && meetingId) {
      supabase
        .from('meeting_participants')
        .update({ video_enabled: newState })
        .eq('meeting_id', meetingId)
        .eq('user_id', currentUserId);
    }
  }, [videoEnabled, currentUserId, meetingId]);

  const handleToggleScreenShare = useCallback(async () => {
    if (!peerManagerRef.current) return;

    try {
      if (screenSharing) {
        peerManagerRef.current.stopScreenShare();
        setScreenSharing(false);
      } else {
        await peerManagerRef.current.startScreenShare();
        setScreenSharing(true);
      }

      // Update in database
      if (currentUserId && meetingId) {
        supabase
          .from('meeting_participants')
          .update({ screen_sharing: !screenSharing })
          .eq('meeting_id', meetingId)
          .eq('user_id', currentUserId);
      }
    } catch (error: any) {
      console.error('Error toggling screen share:', error);
      toast.error('Error', error.message || 'Failed to toggle screen share');
    }
  }, [screenSharing, currentUserId, meetingId]);

  const handleLeave = useCallback(async () => {
    await cleanup();
    setLocation('/dashboard/meetings');
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Joining meeting...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive text-lg">{error}</p>
          <button
            onClick={() => setLocation('/dashboard/meetings')}
            className="text-primary hover:underline"
          >
            Go back to meetings
          </button>
        </div>
      </div>
    );
  }

  const allParticipants = [localStream, ...Array.from(remoteStreams.values())].filter(Boolean);
  const participantCount = participants.length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Meeting Header */}
      <div className="bg-background border-b px-4 py-2 flex items-center justify-between">
        <div>
          <h1 className="font-semibold">{meetingInfo?.title || 'Meeting'}</h1>
          <p className="text-sm text-muted-foreground">
            {participantCount} participant{participantCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Video Grid */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 p-4">
          {allParticipants.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Waiting for participants...</p>
            </div>
          ) : allParticipants.length === 1 ? (
            // Single participant (full screen)
            <div className="h-full">
              {localStream && (
                <VideoParticipant
                  userId={currentUserId || ''}
                  stream={localStream}
                  isLocal
                  name={participantProfilesRef.current.get(currentUserId || '')?.name || 'You'}
                  avatarUrl={participantProfilesRef.current.get(currentUserId || '')?.avatarUrl}
                  audioEnabled={audioEnabled}
                  videoEnabled={videoEnabled}
                  className="h-full"
                />
              )}
            </div>
          ) : (
            // Grid layout for multiple participants
            <div className={`grid gap-4 h-full ${
              allParticipants.length === 2 ? 'grid-cols-1' :
              allParticipants.length <= 4 ? 'grid-cols-2' :
              allParticipants.length <= 9 ? 'grid-cols-3' :
              'grid-cols-4'
            }`}>
              {localStream && (
                <VideoParticipant
                  userId={currentUserId || ''}
                  stream={localStream}
                  isLocal
                  name={participantProfilesRef.current.get(currentUserId || '')?.name || 'You'}
                  avatarUrl={participantProfilesRef.current.get(currentUserId || '')?.avatarUrl}
                  audioEnabled={audioEnabled}
                  videoEnabled={videoEnabled}
                />
              )}
              {Array.from(remoteStreams.entries()).map(([userId, stream]) => {
                const profile = participantProfilesRef.current.get(userId);
                const participant = participants.find(p => p.userId === userId);
                return (
                  <VideoParticipant
                    key={userId}
                    userId={userId}
                    stream={stream}
                    name={profile?.name || 'Unknown'}
                    avatarUrl={profile?.avatarUrl}
                    audioEnabled={participant?.audioEnabled ?? true}
                    videoEnabled={participant?.videoEnabled ?? true}
                    connectionStatus={participant?.connectionStatus}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <MeetingControls
        audioEnabled={audioEnabled}
        videoEnabled={videoEnabled}
        screenSharing={screenSharing}
        onToggleAudio={handleToggleAudio}
        onToggleVideo={handleToggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onLeave={handleLeave}
        onShowParticipants={() => {
          setShowSidebar(true);
          setSidebarView('participants');
        }}
        onShowChat={() => {
          setShowSidebar(true);
          setSidebarView('chat');
        }}
        participantCount={participantCount}
        unreadMessages={unreadMessages}
      />

      {/* Sidebar */}
      <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
        <SheetContent side="right" className="w-full sm:w-96 p-0">
          <Tabs value={sidebarView} onValueChange={(v) => setSidebarView(v as 'participants' | 'chat')}>
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger value="participants" className="flex-1">
                Participants ({participantCount})
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex-1">
                Chat {unreadMessages > 0 && `(${unreadMessages})`}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="participants" className="m-0 h-[calc(100vh-120px)]">
              <ParticipantList
                participants={participants}
                currentUserId={currentUserId || ''}
                className="h-full"
              />
            </TabsContent>
            <TabsContent value="chat" className="m-0 h-[calc(100vh-120px)]">
              {meetingId && currentUserId && (
                <MeetingChat
                  meetingId={meetingId}
                  currentUserId={currentUserId}
                  className="h-full"
                />
              )}
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </div>
  );
}

