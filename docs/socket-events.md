# Socket Events Documentation

This document describes the Socket.IO events implemented for the shared media streaming service.

## Client → Server Events

### Session Management

#### `join_session`
Join or create a media streaming session.

**Data:**
```javascript
{
  sessionId: "string",    // UUID of the session
  userId: "string",       // Unique user identifier
  username: "string",     // Display name for the user
  avatar: "string"        // Optional avatar URL
}
```

**Response Events:**
- `session_joined` - Successful join
- `error` - Failed to join

#### `leave_session`
Leave the current session.

**Data:** None

### Playback Control

#### `sync_playback`
Sync playback state across all users in session. **Leader only**.

**Data:**
```javascript
{
  position: 123.45,        // Current playback position in seconds
  isPlaying: true,         // Whether media is currently playing
  mediaUrl: "string",      // Optional: URL of the media file
  mediaId: "string",       // Optional: Unique media identifier
  playbackRate: 1.0        // Optional: Playback speed (default: 1.0)
}
```

#### `load_media`
Load new media into the session. **Leader only**.

**Data:**
```javascript
{
  mediaUrl: "string",      // URL of the media file
  mediaId: "string",       // Unique media identifier
  mediaTitle: "string",    // Display title for the media
  mediaDuration: 3600      // Duration in seconds
}
```

### Leadership

#### `request_leadership`
Request to become the session leader (if current leader is disconnected).

**Data:** None

### Sync & Recovery

#### `report_desync`
Report playback desynchronization for recovery.

**Data:**
```javascript
{
  reportedPosition: 123.45,  // Client's current position
  reportedTime: 1640995200   // Timestamp of the report
}
```

### Activity

#### `heartbeat`
Send activity heartbeat to maintain connection status.

**Data:** None

#### `request_session_state`
Request current session state.

**Data:** None

## Server → Client Events

### Session Events

#### `session_joined`
Confirmation of successful session join.

**Data:**
```javascript
{
  sessionId: "string",
  userId: "string",
  isLeader: true,
  session: {
    sessionId: "string",
    creatorId: "string",
    leaderId: "string",
    users: [
      {
        id: "string",
        username: "string",
        avatar: "string",
        joinedAt: "2023-01-01T00:00:00.000Z",
        lastSeen: 1640995200,
        isConnected: true,
        isLeader: false
      }
    ],
    playbackState: {
      mediaUrl: "string",
      mediaId: "string",
      position: 123.45,
      isPlaying: true,
      lastUpdateTime: 1640995200,
      playbackRate: 1.0
    },
    createdAt: "2023-01-01T00:00:00.000Z",
    lastActivity: 1640995200,
    userCount: 2
  }
}
```

#### `user_joined`
Another user joined the session.

**Data:**
```javascript
{
  userId: "string",
  username: "string",
  avatar: "string",
  timestamp: 1640995200
}
```

#### `user_left`
A user left the session.

**Data:**
```javascript
{
  userId: "string",
  username: "string",
  timestamp: 1640995200
}
```

### Playback Events

#### `playback_sync`
Broadcast playback state update to all users.

**Data:**
```javascript
{
  mediaUrl: "string",
  mediaId: "string",
  position: 123.45,
  isPlaying: true,
  lastUpdateTime: 1640995200,
  playbackRate: 1.0,
  timestamp: 1640995200,
  leaderId: "string"
}
```

#### `media_loaded`
New media has been loaded into the session.

**Data:**
```javascript
{
  mediaUrl: "string",
  mediaId: "string",
  mediaTitle: "string",
  mediaDuration: 3600,
  timestamp: 1640995200,
  loadedBy: "string"
}
```

### Leadership Events

#### `leadership_changed`
Session leadership has changed.

**Data:**
```javascript
{
  newLeaderId: "string",
  newLeaderName: "string",
  timestamp: 1640995200
}
```

### Recovery Events

#### `desync_recovery`
Response to desync report with authoritative state.

**Data:**
```javascript
{
  authoritativeState: {
    mediaUrl: "string",
    mediaId: "string",
    position: 123.45,
    isPlaying: true,
    lastUpdateTime: 1640995200,
    playbackRate: 1.0,
    timestamp: 1640995200
  },
  reportedPosition: 123.45,
  reportedTime: 1640995200
}
```

### Activity Events

#### `heartbeat_ack`
Acknowledgment of heartbeat.

**Data:**
```javascript
{
  timestamp: 1640995200
}
```

#### `session_state`
Current session state (response to `request_session_state`).

**Data:** Same as `session` object in `session_joined`

### Error Events

#### `error`
Error occurred during operation.

**Data:**
```javascript
{
  message: "string"  // Error description
}
```

## REST API Endpoints

### `POST /api/sessions`
Create a new session.

**Body:**
```javascript
{
  creatorId: "string",
  creatorName: "string"
}
```

**Response:**
```javascript
{
  success: true,
  sessionId: "string",
  creatorId: "string",
  message: "Session created successfully"
}
```

### `GET /api/sessions/:sessionId`
Get session information.

**Response:**
```javascript
{
  success: true,
  session: { /* session object */ }
}
```

### `GET /api/sessions`
List active sessions.

**Response:**
```javascript
{
  success: true,
  sessions: [
    {
      sessionId: "string",
      userCount: 2,
      hasMedia: true,
      createdAt: "2023-01-01T00:00:00.000Z",
      lastActivity: 1640995200
    }
  ],
  totalSessions: 1
}
```

## Usage Example

```javascript
const socket = io('http://localhost:3000');

// Join a session
socket.emit('join_session', {
  sessionId: 'my-session-id',
  userId: 'user-123',
  username: 'Alice',
  avatar: 'https://example.com/avatar.jpg'
});

// Listen for session join confirmation
socket.on('session_joined', (data) => {
  console.log('Joined session:', data);
  
  // If you're the leader, you can control playback
  if (data.isLeader) {
    socket.emit('sync_playback', {
      position: 0,
      isPlaying: true,
      mediaUrl: 'https://example.com/video.mp4'
    });
  }
});

// Listen for playback updates
socket.on('playback_sync', (data) => {
  // Update your media player with the new state
  updateMediaPlayer(data);
});

// Send heartbeat every 30 seconds
setInterval(() => {
  socket.emit('heartbeat');
}, 30000);
```

## Leader/Follower Model

- **Leader**: The user who controls playback (play, pause, seek, load media)
- **Followers**: Users who receive and follow playback commands
- **Leadership Transfer**: Automatic when leader disconnects, or manual via `request_leadership`
- **Session Creator**: Initially becomes the leader

## Desync Recovery

1. Client detects desync (position difference > threshold)
2. Client sends `report_desync` with current position
3. Server responds with `desync_recovery` containing authoritative state
4. Client adjusts to match server state

## Activity Tracking

- Heartbeat mechanism maintains connection status
- User `lastSeen` timestamps updated on heartbeat
- Inactive sessions cleaned up after 24 hours
- Disconnected users marked but not immediately removed