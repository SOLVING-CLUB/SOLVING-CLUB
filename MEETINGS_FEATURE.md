# 🎥 Meetings Feature Documentation

## Overview

A complete, self-hosted WebRTC-based video meeting system integrated into Solving Club. This feature enables real-time video/audio meetings with screen sharing, chat, and participant management - all without third-party services.

## ✨ Features

### Core Features
- ✅ **Real-time Video/Audio Meetings** - WebRTC peer-to-peer connections
- ✅ **Screen Sharing** - Share your screen with participants
- ✅ **Mute/Unmute Audio** - Control your microphone
- ✅ **Enable/Disable Video** - Control your camera
- ✅ **Participant Management** - See who's in the meeting
- ✅ **In-Meeting Chat** - Text chat during meetings
- ✅ **Meeting Scheduling** - Schedule meetings in advance
- ✅ **Project Integration** - Link meetings to projects
- ✅ **Meeting Codes** - Easy join codes for participants
- ✅ **Cross-Platform** - Works on Web, Android, and iOS

### Advanced Features
- ✅ **Connection Status** - Real-time connection indicators
- ✅ **Speaking Indicators** - Visual feedback when someone is speaking
- ✅ **Meeting Settings** - Configurable meeting options
- ✅ **Meeting History** - View past meetings
- ✅ **Participant Roles** - Host, co-host, and participant roles

## 🏗️ Architecture

### Technology Stack
- **WebRTC** - Peer-to-peer video/audio communication
- **simple-peer** - WebRTC wrapper library
- **Supabase Realtime** - Signaling server for WebRTC
- **React + TypeScript** - Frontend framework
- **Capacitor** - Mobile app framework

### Components Structure

```
client/src/
├── lib/webrtc/
│   ├── meeting-signaling.ts    # Supabase Realtime signaling
│   ├── peer-manager.ts         # WebRTC peer connection management
│   └── media-handler.ts        # Media stream utilities
├── components/meetings/
│   ├── VideoParticipant.tsx   # Individual video tile
│   ├── MeetingControls.tsx     # Meeting control buttons
│   ├── ParticipantList.tsx    # Sidebar participant list
│   └── MeetingChat.tsx        # In-meeting chat
└── pages/dashboard/meetings/
    ├── MeetingsPage.tsx        # List all meetings
    ├── CreateMeetingPage.tsx   # Create new meeting
    └── MeetingRoomPage.tsx     # Active meeting room
```

## 📊 Database Schema

### Tables
1. **meetings** - Meeting information
2. **meeting_participants** - Participants and their status
3. **meeting_messages** - In-meeting chat messages
4. **meeting_recordings** - Meeting recordings (future)
5. **meeting_invitations** - Meeting invitations

See `supabase/meetings-schema.sql` for complete schema.

## 🚀 Setup Instructions

### 1. Database Setup
Run the meetings schema in your Supabase SQL editor:
```sql
-- Execute supabase/meetings-schema.sql
```

### 2. Install Dependencies
```bash
cd client
npm install simple-peer @types/simple-peer
```

### 3. Mobile Permissions

**Android** (`android/app/src/main/AndroidManifest.xml`):
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

**iOS** (`ios/App/App/Info.plist`):
```xml
<key>NSCameraUsageDescription</key>
<string>This app needs access to your camera for video meetings.</string>
<key>NSMicrophoneUsageDescription</key>
<string>This app needs access to your microphone for video meetings.</string>
```

### 4. STUN/TURN Servers

For production, configure your own TURN server. Currently using free Google STUN servers:
- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`

**To add TURN server** (in `peer-manager.ts`):
```typescript
iceServers: [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: 'turn:your-turn-server.com:3478',
    username: 'your-username',
    credential: 'your-password'
  }
]
```

## 📱 Usage

### Creating a Meeting

1. Navigate to **Meetings** from the sidebar
2. Click **New Meeting**
3. Fill in meeting details:
   - Title (required)
   - Description (optional)
   - Link to project (optional)
   - Scheduled time (optional)
   - Meeting settings
4. Click **Create Meeting**

### Joining a Meeting

1. From the meetings list, click **Join** on an active meeting
2. Or use the meeting code to join directly
3. Grant camera/microphone permissions when prompted
4. You'll automatically connect to other participants

### During a Meeting

- **Mute/Unmute**: Click the microphone button
- **Enable/Disable Video**: Click the camera button
- **Screen Share**: Click the screen share button (web only)
- **View Participants**: Click the participants button
- **Chat**: Click the chat button
- **Leave**: Click the leave button

### From a Project

1. Open any project
2. Click **Start Meeting** in the project header
3. Meeting will be automatically linked to the project

## 🔧 Configuration

### Meeting Settings

Available settings when creating a meeting:
- **Mute on Join** - Participants join muted
- **Video on Join** - Participants join with video enabled
- **Waiting Room** - Require host approval to join
- **Allow Screen Share** - Enable screen sharing
- **Allow Chat** - Enable in-meeting chat
- **Record Meeting** - Record meeting (coming soon)

### WebRTC Configuration

Edit `client/src/lib/webrtc/peer-manager.ts` to customize:
- ICE servers (STUN/TURN)
- Video quality/constraints
- Audio constraints
- Connection timeouts

## 🐛 Troubleshooting

### No Video/Audio
1. Check browser permissions (camera/microphone)
2. Ensure HTTPS (required for WebRTC)
3. Check firewall/network settings
4. Try different browser

### Connection Issues
1. Check STUN/TURN server configuration
2. Verify network connectivity
3. Check Supabase Realtime connection
4. Review browser console for errors

### Mobile Issues
1. Ensure permissions are granted
2. Check Capacitor configuration
3. Verify native plugins are installed
4. Test on physical device (not emulator)

## 🔒 Security

- All signaling goes through Supabase Realtime (encrypted)
- WebRTC uses DTLS/SRTP for media encryption
- Row Level Security (RLS) on all database tables
- Meeting access controlled by database policies

## 🚧 Future Enhancements

- [ ] Meeting recording
- [ ] Waiting room functionality
- [ ] Raise hand feature
- [ ] Meeting transcripts
- [ ] Breakout rooms
- [ ] Virtual backgrounds
- [ ] Meeting analytics
- [ ] Integration with calendar

## 📚 Resources

- [WebRTC Documentation](https://webrtc.org/)
- [simple-peer Documentation](https://github.com/feross/simple-peer)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Capacitor Camera Plugin](https://capacitorjs.com/docs/apis/camera)

## 🎯 Best Practices

1. **Network**: Use stable internet connection for best quality
2. **Bandwidth**: Limit participants for better performance
3. **Permissions**: Always request permissions before joining
4. **Cleanup**: Properly cleanup streams on component unmount
5. **Error Handling**: Handle connection failures gracefully
6. **Testing**: Test on multiple browsers and devices

## 📝 Notes

- WebRTC requires HTTPS in production
- Screen sharing is web-only (not available on mobile)
- Maximum recommended participants: 10-15 for best quality
- For larger meetings, consider SFU (Selective Forwarding Unit) architecture

---

**Built with ❤️ using WebRTC, React, and Supabase**

