/**
 * Media Handler Utilities
 * Helper functions for managing media streams and permissions
 */

export interface MediaConstraints {
  audio: boolean | MediaTrackConstraints;
  video: boolean | MediaTrackConstraints;
}

/**
 * Request media permissions
 */
export async function requestMediaPermissions(
  audio: boolean = true,
  video: boolean = true
): Promise<boolean> {
  try {
    if (audio) {
      const audioPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (audioPermission.state === 'denied') {
        throw new Error('Microphone permission denied');
      }
    }

    if (video) {
      const videoPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      if (videoPermission.state === 'denied') {
        throw new Error('Camera permission denied');
      }
    }

    return true;
  } catch (error) {
    console.error('Error requesting permissions:', error);
    // Fallback: try to get media anyway
    return true;
  }
}

/**
 * Get available media devices
 */
export async function getMediaDevices(): Promise<{
  audioInputs: MediaDeviceInfo[];
  videoInputs: MediaDeviceInfo[];
  audioOutputs: MediaDeviceInfo[];
}> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    
    return {
      audioInputs: devices.filter(device => device.kind === 'audioinput'),
      videoInputs: devices.filter(device => device.kind === 'videoinput'),
      audioOutputs: devices.filter(device => device.kind === 'audiooutput'),
    };
  } catch (error) {
    console.error('Error enumerating devices:', error);
    return {
      audioInputs: [],
      videoInputs: [],
      audioOutputs: [],
    };
  }
}

/**
 * Switch camera device
 */
export async function switchCamera(
  stream: MediaStream,
  deviceId: string
): Promise<MediaStream> {
  try {
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) {
      throw new Error('No video track found');
    }

    // Stop old track
    videoTrack.stop();

    // Get new track with new device
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
      audio: stream.getAudioTracks()[0] ? { deviceId: { exact: stream.getAudioTracks()[0].getSettings().deviceId } } : false,
    });

    // Replace track in stream
    const newVideoTrack = newStream.getVideoTracks()[0];
    if (newVideoTrack) {
      stream.removeTrack(videoTrack);
      stream.addTrack(newVideoTrack);
    }

    return stream;
  } catch (error) {
    console.error('Error switching camera:', error);
    throw error;
  }
}

/**
 * Switch microphone device
 */
export async function switchMicrophone(
  stream: MediaStream,
  deviceId: string
): Promise<MediaStream> {
  try {
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) {
      throw new Error('No audio track found');
    }

    // Stop old track
    audioTrack.stop();

    // Get new track with new device
    const newStream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: { exact: deviceId } },
      video: stream.getVideoTracks()[0] ? { deviceId: { exact: stream.getVideoTracks()[0].getSettings().deviceId } } : false,
    });

    // Replace track in stream
    const newAudioTrack = newStream.getAudioTracks()[0];
    if (newAudioTrack) {
      stream.removeTrack(audioTrack);
      stream.addTrack(newAudioTrack);
    }

    return stream;
  } catch (error) {
    console.error('Error switching microphone:', error);
    throw error;
  }
}

/**
 * Check if screen sharing is supported
 */
export function isScreenShareSupported(): boolean {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getDisplayMedia
  );
}

/**
 * Check if getUserMedia is supported
 */
export function isGetUserMediaSupported(): boolean {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia
  );
}

/**
 * Get stream quality info
 */
export function getStreamQuality(stream: MediaStream): {
  audioTracks: number;
  videoTracks: number;
  videoSettings?: MediaTrackSettings;
  audioSettings?: MediaTrackSettings;
} {
  const audioTracks = stream.getAudioTracks();
  const videoTracks = stream.getVideoTracks();

  return {
    audioTracks: audioTracks.length,
    videoTracks: videoTracks.length,
    videoSettings: videoTracks[0]?.getSettings(),
    audioSettings: audioTracks[0]?.getSettings(),
  };
}

/**
 * Stop all tracks in a stream
 */
export function stopStream(stream: MediaStream | null) {
  if (stream) {
    stream.getTracks().forEach(track => {
      track.stop();
    });
  }
}

/**
 * Clone a stream (useful for multiple video elements)
 */
export function cloneStream(stream: MediaStream): MediaStream {
  const clonedStream = new MediaStream();
  
  stream.getAudioTracks().forEach(track => {
    clonedStream.addTrack(track);
  });
  
  stream.getVideoTracks().forEach(track => {
    clonedStream.addTrack(track);
  });
  
  return clonedStream;
}

