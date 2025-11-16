import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Video, VideoOff, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoParticipantProps {
  userId: string;
  stream: MediaStream | null;
  isLocal?: boolean;
  name?: string;
  avatarUrl?: string;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
  isScreenSharing?: boolean;
  connectionStatus?: 'connecting' | 'connected' | 'disconnected';
  className?: string;
}

export default function VideoParticipant({
  userId,
  stream,
  isLocal = false,
  name = 'Unknown',
  avatarUrl,
  audioEnabled = true,
  videoEnabled = true,
  isScreenSharing = false,
  connectionStatus = 'connected',
  className,
}: VideoParticipantProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);

      // Setup audio level detection for speaking indicator
      if (!isLocal && stream.getAudioTracks().length > 0) {
        setupAudioAnalysis(stream);
      }
    } else if (videoRef.current && !stream) {
      videoRef.current.srcObject = null;
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stream, isLocal]);

  // Setup audio analysis for speaking detection
  const setupAudioAnalysis = (stream: MediaStream) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const checkAudioLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setIsSpeaking(average > 30); // Threshold for speaking
          requestAnimationFrame(checkAudioLevel);
        }
      };
      
      checkAudioLevel();
    } catch (error) {
      console.error('Error setting up audio analysis:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isVideoActive = videoEnabled && stream?.getVideoTracks().some(track => track.enabled);

  return (
    <div
      className={cn(
        'relative w-full h-full rounded-lg overflow-hidden bg-background border-2 transition-all',
        isLocal ? 'border-primary' : 'border-border',
        isSpeaking && !isLocal ? 'ring-2 ring-primary ring-offset-2' : '',
        connectionStatus === 'connecting' && 'opacity-50',
        className
      )}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // Always mute local video to prevent feedback
        className={cn(
          'w-full h-full object-cover',
          !isVideoActive && 'hidden'
        )}
      />

      {/* Avatar/Name overlay when video is off */}
      {!isVideoActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Avatar className="w-24 h-24">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback className="text-2xl">
              {avatarUrl ? <User className="w-12 h-12" /> : getInitials(name)}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Name and status overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-white text-sm font-medium truncate">
              {isLocal ? `${name} (You)` : name}
            </span>
            {isScreenSharing && (
              <Badge variant="secondary" className="text-xs">
                Screen
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {audioEnabled ? (
              <Mic className="w-4 h-4 text-white" />
            ) : (
              <MicOff className="w-4 h-4 text-red-500" />
            )}
            {videoEnabled ? (
              <Video className="w-4 h-4 text-white" />
            ) : (
              <VideoOff className="w-4 h-4 text-red-500" />
            )}
          </div>
        </div>
      </div>

      {/* Connection status indicator */}
      {connectionStatus === 'connecting' && (
        <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
          Connecting...
        </div>
      )}

      {connectionStatus === 'disconnected' && (
        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
          Disconnected
        </div>
      )}

      {/* Speaking indicator */}
      {isSpeaking && !isLocal && (
        <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
      )}
    </div>
  );
}

