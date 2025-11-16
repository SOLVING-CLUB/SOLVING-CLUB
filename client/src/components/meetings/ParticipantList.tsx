import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MicOff, Video, VideoOff, User, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Participant {
  userId: string;
  name: string;
  avatarUrl?: string;
  role: 'host' | 'co-host' | 'participant';
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  handRaised: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  joinedAt: string;
}

interface ParticipantListProps {
  participants: Participant[];
  currentUserId: string;
  className?: string;
}

export default function ParticipantList({
  participants,
  currentUserId,
  className,
}: ParticipantListProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sortedParticipants = [...participants].sort((a, b) => {
    // Hosts first
    if (a.role === 'host' && b.role !== 'host') return -1;
    if (a.role !== 'host' && b.role === 'host') return 1;
    // Then co-hosts
    if (a.role === 'co-host' && b.role === 'participant') return -1;
    if (a.role === 'participant' && b.role === 'co-host') return 1;
    // Then by join time
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
  });

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg">Participants ({participants.length})</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {sortedParticipants.map((participant) => {
            const isCurrentUser = participant.userId === currentUserId;
            
            return (
              <div
                key={participant.userId}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg transition-colors',
                  isCurrentUser && 'bg-muted'
                )}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={participant.avatarUrl} alt={participant.name} />
                  <AvatarFallback>
                    {participant.avatarUrl ? (
                      <User className="w-5 h-5" />
                    ) : (
                      getInitials(participant.name)
                    )}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {participant.name}
                      {isCurrentUser && ' (You)'}
                    </span>
                    {participant.role === 'host' && (
                      <Crown className="w-4 h-4 text-yellow-500" />
                    )}
                    {participant.handRaised && (
                      <Badge variant="secondary" className="text-xs">
                        ✋
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {participant.audioEnabled ? (
                      <Mic className="w-3 h-3 text-muted-foreground" />
                    ) : (
                      <MicOff className="w-3 h-3 text-red-500" />
                    )}
                    {participant.videoEnabled ? (
                      <Video className="w-3 h-3 text-muted-foreground" />
                    ) : (
                      <VideoOff className="w-3 h-3 text-red-500" />
                    )}
                    {participant.screenSharing && (
                      <Badge variant="outline" className="text-xs">
                        Screen
                      </Badge>
                    )}
                    {participant.connectionStatus === 'connecting' && (
                      <Badge variant="outline" className="text-xs text-yellow-500">
                        Connecting...
                      </Badge>
                    )}
                    {participant.connectionStatus === 'disconnected' && (
                      <Badge variant="outline" className="text-xs text-red-500">
                        Disconnected
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

