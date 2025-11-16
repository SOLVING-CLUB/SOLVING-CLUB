import { MeetingSignaling, WebRTCSignal } from './meeting-signaling';

export interface PeerStream {
  userId: string;
  stream: MediaStream;
  peer: RTCPeerConnection;
  isLocal: boolean;
}

interface PeerConnection {
  pc: RTCPeerConnection;
  userId: string;
  isInitiator: boolean;
}

export class PeerManager {
  private peers: Map<string, PeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private localScreenStream: MediaStream | null = null;
  private signaling: MeetingSignaling;
  private onStreamCallback: ((userId: string, stream: MediaStream, isLocal: boolean) => void) | null = null;
  private onStreamEndCallback: ((userId: string) => void) | null = null;
  private onErrorCallback: ((userId: string, error: Error) => void) | null = null;
  private meetingId: string | null = null;
  private currentUserId: string | null = null;

  private readonly iceServers: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // Add your TURN server here for production
      // {
      //   urls: 'turn:your-turn-server.com:3478',
      //   username: 'your-username',
      //   credential: 'your-password'
      // }
    ],
  };

  constructor(signaling: MeetingSignaling) {
    this.signaling = signaling;
    this.setupSignalingHandlers();
  }

  /**
   * Initialize with meeting context
   */
  initialize(meetingId: string, userId: string) {
    this.meetingId = meetingId;
    this.currentUserId = userId;
  }

  /**
   * Setup signaling handlers
   */
  private setupSignalingHandlers() {
    this.signaling.onSignal((signal: WebRTCSignal) => {
      this.handleSignal(signal);
    });
  }

  /**
   * Initialize local media stream (audio/video)
   */
  async initializeLocalStream(audio: boolean = true, video: boolean = true): Promise<MediaStream> {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        throw new Error('Not running in a browser environment');
      }

      // Stop existing stream if any
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        audio: audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } : false,
        video: video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        } : false,
      };

      // Try to get user media - let the browser handle any restrictions
      // This will work on HTTPS, localhost, or if the browser allows it
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
        } else if ((navigator as any).getUserMedia) {
          // Fallback for older browsers
          this.localStream = await new Promise<MediaStream>((resolve, reject) => {
            (navigator as any).getUserMedia(constraints, resolve, reject);
          });
        } else {
          // If neither exists, it's likely a security restriction
          // Try to provide helpful error message
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          const isSecure = window.location.protocol === 'https:';
          if (!isLocalhost && !isSecure) {
            throw new Error(`getUserMedia requires HTTPS or localhost. You're accessing via ${window.location.protocol}//${window.location.hostname}. Please use https:// or http://localhost:5173`);
          }
          throw new Error('getUserMedia is not available in this browser. Please check your browser permissions and ensure WebRTC is supported.');
        }
      } catch (mediaError: any) {
        // Re-throw with more context if it's a security/permission error
        if (mediaError.name === 'NotAllowedError' || mediaError.name === 'PermissionDeniedError') {
          throw new Error('Camera/microphone access denied. Please allow permissions in your browser settings.');
        } else if (mediaError.name === 'NotFoundError' || mediaError.name === 'DevicesNotFoundError') {
          throw new Error('No camera or microphone found. Please connect a device and try again.');
        } else if (mediaError.name === 'NotReadableError' || mediaError.name === 'TrackStartError') {
          throw new Error('Camera/microphone is already in use by another application.');
        } else if (mediaError.message?.includes('secure context') || mediaError.message?.includes('HTTPS')) {
          throw new Error(`getUserMedia requires HTTPS or localhost. Current URL: ${window.location.href}. Please use https:// or http://localhost:5173`);
        }
        // Re-throw the original error
        throw mediaError;
      }
      
      // Notify about local stream
      if (this.onStreamCallback && this.currentUserId) {
        this.onStreamCallback(this.currentUserId, this.localStream, true);
      }

      // Add tracks to all existing peer connections
      this.peers.forEach((peerConn) => {
        if (this.localStream) {
          this.localStream.getTracks().forEach(track => {
            const sender = peerConn.pc.getSenders().find(s => s.track?.kind === track.kind);
            if (sender) {
              sender.replaceTrack(track);
            } else {
              peerConn.pc.addTrack(track, this.localStream!);
            }
          });
        }
      });

      return this.localStream;
    } catch (error) {
      console.error('Error getting user media:', error);
      throw error;
    }
  }

  /**
   * Get screen share stream
   */
  async startScreenShare(): Promise<MediaStream> {
    try {
      // Check if getDisplayMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen sharing is not supported in this browser');
      }

      if (this.localScreenStream) {
        return this.localScreenStream;
      }

      this.localScreenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        } as MediaTrackConstraints,
        audio: true, // Capture system audio if available
      });

      // Handle screen share end
      this.localScreenStream.getVideoTracks()[0].addEventListener('ended', () => {
        this.stopScreenShare();
      });

      // Replace video track in all peers
      this.peers.forEach((peerConn) => {
        if (this.localScreenStream) {
          const videoTrack = this.localScreenStream.getVideoTracks()[0];
          const sender = peerConn.pc.getSenders().find((s: RTCRtpSender) => 
            s.track?.kind === 'video'
          );
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        }
      });

      return this.localScreenStream;
    } catch (error) {
      console.error('Error starting screen share:', error);
      throw error;
    }
  }

  /**
   * Stop screen share
   */
  stopScreenShare() {
    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach(track => track.stop());
      this.localScreenStream = null;

      // Restore camera video track
      if (this.localStream) {
        const videoTrack = this.localStream.getVideoTracks()[0];
        this.peers.forEach((peerConn) => {
          const sender = peerConn.pc.getSenders().find((s: RTCRtpSender) => 
            s.track?.kind === 'video'
          );
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        });
      }
    }
  }

  /**
   * Create a peer connection for a user
   */
  createPeer(userId: string, initiator: boolean): RTCPeerConnection {
    // Don't create peer for ourselves
    if (userId === this.currentUserId) {
      throw new Error('Cannot create peer for self');
    }

    // Remove existing peer if any
    if (this.peers.has(userId)) {
      this.removePeer(userId);
    }

    // Create RTCPeerConnection
    const pc = new RTCPeerConnection(this.iceServers);

    // Add local stream tracks
    const stream = this.localScreenStream || this.localStream;
    if (stream) {
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && this.meetingId && this.currentUserId) {
        this.signaling.sendSignal(userId, event.candidate, 'ice-candidate');
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0] && this.onStreamCallback) {
        this.onStreamCallback(userId, event.streams[0], false);
      }
    };

    // Handle connection state
    pc.onconnectionstatechange = () => {
      console.log(`Connection state for ${userId}:`, pc.connectionState);
      if (pc.connectionState === 'connected') {
        console.log(`✅ Connected to peer: ${userId}`);
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        console.log(`🔌 Peer disconnected: ${userId}`);
        if (this.onErrorCallback) {
          this.onErrorCallback(userId, new Error(`Connection ${pc.connectionState}`));
        }
      }
    };

    // Handle errors
    pc.onerror = (error) => {
      console.error(`❌ Peer error for ${userId}:`, error);
      if (this.onErrorCallback) {
        this.onErrorCallback(userId, new Error('Peer connection error'));
      }
    };

    const peerConn: PeerConnection = {
      pc,
      userId,
      isInitiator: initiator,
    };

    this.peers.set(userId, peerConn);

    // If initiator, create offer
    if (initiator) {
      this.createOffer(userId);
    }

    return pc;
  }

  /**
   * Create and send offer
   */
  private async createOffer(userId: string) {
    const peerConn = this.peers.get(userId);
    if (!peerConn || !this.meetingId || !this.currentUserId) return;

    try {
      const offer = await peerConn.pc.createOffer();
      await peerConn.pc.setLocalDescription(offer);
      
      this.signaling.sendSignal(userId, offer, 'offer');
    } catch (error) {
      console.error(`Error creating offer for ${userId}:`, error);
      if (this.onErrorCallback) {
        this.onErrorCallback(userId, error as Error);
      }
    }
  }

  /**
   * Create and send answer
   */
  private async createAnswer(userId: string) {
    const peerConn = this.peers.get(userId);
    if (!peerConn || !this.meetingId || !this.currentUserId) return;

    try {
      const answer = await peerConn.pc.createAnswer();
      await peerConn.pc.setLocalDescription(answer);
      
      this.signaling.sendSignal(userId, answer, 'answer');
    } catch (error) {
      console.error(`Error creating answer for ${userId}:`, error);
      if (this.onErrorCallback) {
        this.onErrorCallback(userId, error as Error);
      }
    }
  }

  /**
   * Handle incoming WebRTC signal
   */
  private async handleSignal(signal: WebRTCSignal) {
    const { fromUserId, signal: signalData, signalType } = signal;

    // Ignore signals from ourselves
    if (fromUserId === this.currentUserId) {
      return;
    }

    let peerConn = this.peers.get(fromUserId);

    // Create peer if it doesn't exist (for incoming offers)
    if (!peerConn && signalType === 'offer') {
      this.createPeer(fromUserId, false);
      peerConn = this.peers.get(fromUserId);
    }

    if (!peerConn) {
      console.warn(`No peer connection found for ${fromUserId}`);
      return;
    }

    try {
      if (signalType === 'offer') {
        // Only set remote description if we're in the right state
        if (peerConn.pc.signalingState === 'stable' || peerConn.pc.signalingState === 'have-local-offer') {
          await peerConn.pc.setRemoteDescription(new RTCSessionDescription(signalData as RTCSessionDescriptionInit));
          await this.createAnswer(fromUserId);
        } else {
          console.warn(`Ignoring offer from ${fromUserId}, wrong signaling state: ${peerConn.pc.signalingState}`);
        }
      } else if (signalType === 'answer') {
        // Only set remote description if we're waiting for an answer
        if (peerConn.pc.signalingState === 'have-local-offer') {
          await peerConn.pc.setRemoteDescription(new RTCSessionDescription(signalData as RTCSessionDescriptionInit));
        } else {
          console.warn(`Ignoring answer from ${fromUserId}, wrong signaling state: ${peerConn.pc.signalingState}`);
        }
      } else if (signalType === 'ice-candidate') {
        // Add ICE candidate if connection is not closed
        if (peerConn.pc.signalingState !== 'closed') {
          try {
            await peerConn.pc.addIceCandidate(new RTCIceCandidate(signalData as RTCIceCandidateInit));
          } catch (err) {
            // Ignore errors for ICE candidates (they might be duplicates or invalid)
            console.debug(`ICE candidate error (can be ignored):`, err);
          }
        }
      }
    } catch (error) {
      console.error(`Error handling signal from ${fromUserId}:`, error);
      if (this.onErrorCallback) {
        this.onErrorCallback(fromUserId, error as Error);
      }
    }
  }

  /**
   * Toggle audio (mute/unmute)
   */
  toggleAudio(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Toggle video
   */
  toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Set callbacks
   */
  onStream(callback: (userId: string, stream: MediaStream, isLocal: boolean) => void) {
    this.onStreamCallback = callback;
  }

  onStreamEnd(callback: (userId: string) => void) {
    this.onStreamEndCallback = callback;
  }

  onError(callback: (userId: string, error: Error) => void) {
    this.onErrorCallback = callback;
  }

  /**
   * Remove a peer
   */
  removePeer(userId: string) {
    const peerConn = this.peers.get(userId);
    if (peerConn) {
      peerConn.pc.close();
      this.peers.delete(userId);
      if (this.onStreamEndCallback) {
        this.onStreamEndCallback(userId);
      }
    }
  }

  /**
   * Remove all peers and cleanup
   */
  cleanup() {
    // Stop all media tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach(track => track.stop());
      this.localScreenStream = null;
    }

    // Close all peer connections
    this.peers.forEach((peerConn) => {
      peerConn.pc.close();
    });
    this.peers.clear();

    // Clear callbacks
    this.onStreamCallback = null;
    this.onStreamEndCallback = null;
    this.onErrorCallback = null;
  }

  /**
   * Get all active peer IDs
   */
  getPeerIds(): string[] {
    return Array.from(this.peers.keys());
  }

  /**
   * Check if peer exists
   */
  hasPeer(userId: string): boolean {
    return this.peers.has(userId);
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }
}
