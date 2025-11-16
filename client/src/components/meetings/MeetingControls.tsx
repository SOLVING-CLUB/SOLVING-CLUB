import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, PhoneOff, Users, MessageSquare, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MeetingControlsProps {
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onLeave: () => void;
  onShowParticipants?: () => void;
  onShowChat?: () => void;
  onShowSettings?: () => void;
  participantCount?: number;
  unreadMessages?: number;
  className?: string;
}

export default function MeetingControls({
  audioEnabled,
  videoEnabled,
  screenSharing,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onLeave,
  onShowParticipants,
  onShowChat,
  onShowSettings,
  participantCount,
  unreadMessages = 0,
  className,
}: MeetingControlsProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2 p-4 bg-background border-t', className)}>
      {/* Audio Toggle */}
      <Button
        variant={audioEnabled ? 'default' : 'destructive'}
        size="icon"
        className="rounded-full w-12 h-12"
        onClick={onToggleAudio}
        title={audioEnabled ? 'Mute' : 'Unmute'}
      >
        {audioEnabled ? (
          <Mic className="w-5 h-5" />
        ) : (
          <MicOff className="w-5 h-5" />
        )}
      </Button>

      {/* Video Toggle */}
      <Button
        variant={videoEnabled ? 'default' : 'destructive'}
        size="icon"
        className="rounded-full w-12 h-12"
        onClick={onToggleVideo}
        title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
      >
        {videoEnabled ? (
          <Video className="w-5 h-5" />
        ) : (
          <VideoOff className="w-5 h-5" />
        )}
      </Button>

      {/* Screen Share Toggle */}
      <Button
        variant={screenSharing ? 'default' : 'outline'}
        size="icon"
        className="rounded-full w-12 h-12"
        onClick={onToggleScreenShare}
        title={screenSharing ? 'Stop sharing' : 'Share screen'}
      >
        {screenSharing ? (
          <MonitorOff className="w-5 h-5" />
        ) : (
          <Monitor className="w-5 h-5" />
        )}
      </Button>

      {/* Participants Button */}
      {onShowParticipants && (
        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-12 h-12 relative"
          onClick={onShowParticipants}
          title="Participants"
        >
          <Users className="w-5 h-5" />
          {participantCount !== undefined && participantCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {participantCount}
            </span>
          )}
        </Button>
      )}

      {/* Chat Button */}
      {onShowChat && (
        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-12 h-12 relative"
          onClick={onShowChat}
          title="Chat"
        >
          <MessageSquare className="w-5 h-5" />
          {unreadMessages > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
        </Button>
      )}

      {/* Settings Button */}
      {onShowSettings && (
        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-12 h-12"
          onClick={onShowSettings}
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </Button>
      )}

      {/* Leave Button */}
      <Button
        variant="destructive"
        size="icon"
        className="rounded-full w-12 h-12"
        onClick={onLeave}
        title="Leave meeting"
      >
        <PhoneOff className="w-5 h-5" />
      </Button>
    </div>
  );
}

