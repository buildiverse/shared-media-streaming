const express = require("express");
const AWS = require("aws-sdk");
const { createServer } = require("http");
const { v4: uuidv4 } = require("uuid");
const { initializeSocket, activeSessions } = require("./socket");
const { getMongoClient, mongoUri } = require("./db");
const { MediaSession } = require("./models/MediaSession");
require("dotenv").config();


const app = express();
const server = createServer(app);
const io = initializeSocket(server);
const port = 3000;



// Enable JSON parsing
app.use(express.json());

app.get("/", (req, res) => {
  res.send("<h1>Welcome to the Shared Media Streaming Service</h1>");
});

// Create a new session
app.post("/api/sessions", async (req, res) => {
  try {
    const { creatorId, creatorName } = req.body;
    
    if (!creatorId || !creatorName) {
      return res.status(400).json({
        success: false,
        message: "creatorId and creatorName are required"
      });
    }

    const sessionId = uuidv4();
    const session = new MediaSession(sessionId, creatorId);
    activeSessions.set(sessionId, session);
    await saveSessionToDb(session);

    res.json({
      success: true,
      sessionId,
      creatorId,
      message: "Session created successfully"
    });
  } catch (error) {
    console.error("Failed to create session:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create session",
      error: error.message
    });
  }
});

// Get session info
app.get("/api/sessions/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    let session = activeSessions.get(sessionId);
    if (!session) {
      session = await loadSessionFromDb(sessionId);
    }

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    res.json({
      success: true,
      session: session.serialize()
    });
  } catch (error) {
    console.error("Failed to get session:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get session",
      error: error.message
    });
  }
});

// List active sessions
app.get("/api/sessions", (req, res) => {
  try {
    const sessions = Array.from(activeSessions.values()).map(session => ({
      sessionId: session.sessionId,
      userCount: session.users.size,
      hasMedia: !!session.playbackState.mediaUrl,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity
    }));

    res.json({
      success: true,
      sessions,
      totalSessions: sessions.length
    });
  } catch (error) {
    console.error("Failed to list sessions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list sessions",
      error: error.message
    });
  }
});

app.get("/check-mongo", async (req, res) => {
  let client;

  try {
    client = new MongoClient(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();

    const adminDb = client.db().admin();
    const serverStatus = await adminDb.serverStatus();

    res.json({
      success: true,
      message: "Successfully connected to MongoDB.",
      host: serverStatus.host,
      version: serverStatus.version,
      uptime: serverStatus.uptime,
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to connect to MongoDB.",
      error: error.message,
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
});

app.post("/upload-test-file", async (req, res) => {
  const bucketName = process.env.S3_BUCKET;
  const fileName = `test-file-${Date.now()}.txt`;
  const fileContent = "This is a test file uploaded from my Express app!";

  AWS.config.update({
    accessKeyId: process.env.S3_USER_KEY,
    secretAccessKey: process.env.S3_SECRET, 
    region: process.env.S3_REGION,
  });

  const s3 = new AWS.S3();

  if (!bucketName) {
    return res.status(500).json({
      success: false,
      message: "S3_BUCKET environment variable is not set.",
    });
  }

  const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: fileContent,
    ContentType: "text/plain",
    ACL: "private",
  };

  try {
    const data = await s3.upload(params).promise();
    res.json({
      success: true,
      message: "Test file uploaded successfully to S3!",
      fileLocation: data.Location,
      fileName: data.Key,
      bucket: data.Bucket,
    });
  } catch (error) {
    console.error("S3 upload failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload test file to S3.",
      error: error.message,
    });
  }
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log("socket.io connection");
  console.log(`User connected: ${socket.id}`);

  // Debug logging for all incoming events
  socket.onAny((event, ...args) => {
    console.log(`[DEBUG] Received event: ${event}`, args);
  });

  // Debug logging for all outgoing events
  const originalEmit = socket.emit;
  socket.emit = function(event, ...args) {
    console.log(`[DEBUG] Emitting event: ${event}`, args);
    originalEmit.apply(socket, [event, ...args]);
  };
  
  let currentUserId = null;
  let currentSessionId = null;

  // Helper function to emit to all users in a session except sender
  const broadcastToSession = (sessionId, event, data, excludeSocketId = null) => {
    const session = activeSessions.get(sessionId);
    if (session) {
      session.users.forEach((userInfo, userId) => {
        if (userInfo.socketId && userInfo.socketId !== excludeSocketId) {
          socket.to(userInfo.socketId).emit(event, data);
        }
      });
    }
  };

  // Helper function to emit to all users in a session including sender
  const emitToSession = (sessionId, event, data) => {
    io.to(`session:${sessionId}`).emit(event, data);
  };

  // Join or create a session
  socket.on('join_session', async (data) => {
    console.log("join_session", data);
    try {
      const { sessionId, userId, username, avatar } = data;
      
      if (!sessionId || !userId || !username) {
        socket.emit('error', { message: 'Missing required fields: sessionId, userId, username' });
        return;
      }

      // Leave current session if any
      if (currentSessionId) {
        socket.emit('error', { message: 'Already in a session. Leave current session first.' });
        return;
      }

      let session = activeSessions.get(sessionId);
      
      // Try to load session from database if not in memory
      if (!session) {
        session = await loadSessionFromDb(sessionId);
        if (session) {
          activeSessions.set(sessionId, session);
        }
      }

      // Create new session if it doesn't exist
      if (!session) {
        session = new MediaSession(sessionId, userId);
        activeSessions.set(sessionId, session);
        await saveSessionToDb(session);
      }

      // Add user to session
      session.addUser(userId, {
        username,
        avatar: avatar || null,
        socketId: socket.id,
        isLeader: session.leaderId === userId
      });

      // Update user mappings
      currentUserId = userId;
      currentSessionId = sessionId;
      userSessions.set(userId, sessionId);

      // Join socket room
      socket.join(`session:${sessionId}`);

      // Send session state to the joining user
      socket.emit('session_joined', {
        sessionId,
        userId,
        isLeader: session.leaderId === userId,
        session: session.serialize()
      });

      // Notify other users about the new user
      broadcastToSession(sessionId, 'user_joined', {
        userId,
        username,
        avatar,
        timestamp: Date.now()
      }, socket.id);

      // Save session state
      await saveSessionToDb(session);

      console.log(`User ${username} (${userId}) joined session ${sessionId}`);
    } catch (error) {
      console.error('Error in join_session:', error);
      socket.emit('error', { message: 'Failed to join session' });
    }
  });

  // Leave current session
  socket.on('leave_session', async () => {
    if (currentSessionId && currentUserId) {
      await handleUserLeave();
    }
  });

  // Sync playback state (leader only)
  socket.on('sync_playback', async (data) => {
    try {
      if (!currentSessionId || !currentUserId) {
        socket.emit('error', { message: 'Not in a session' });
        return;
      }

      const session = activeSessions.get(currentSessionId);
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      if (session.leaderId !== currentUserId) {
        socket.emit('error', { message: 'Only the leader can control playback' });
        return;
      }

      const { position, isPlaying, mediaUrl, mediaId, playbackRate = 1.0 } = data;
      
      // Update session playback state
      session.updatePlaybackState({
        position: parseFloat(position) || 0,
        isPlaying: Boolean(isPlaying),
        mediaUrl: mediaUrl || session.playbackState.mediaUrl,
        mediaId: mediaId || session.playbackState.mediaId,
        playbackRate: parseFloat(playbackRate) || 1.0
      });

      // Broadcast to all users in session
      emitToSession(currentSessionId, 'playback_sync', {
        ...session.playbackState,
        position: session.getCurrentPlaybackPosition(),
        timestamp: Date.now(),
        leaderId: session.leaderId
      });

      // Save session state
      await saveSessionToDb(session);

    } catch (error) {
      console.error('Error in sync_playback:', error);
      socket.emit('error', { message: 'Failed to sync playback' });
    }
  });

  // Request to become leader
  socket.on('request_leadership', async () => {
    try {
      if (!currentSessionId || !currentUserId) {
        socket.emit('error', { message: 'Not in a session' });
        return;
      }

      const session = activeSessions.get(currentSessionId);
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      // Check if current leader is still connected
      const currentLeader = session.users.get(session.leaderId);
      if (!currentLeader || !currentLeader.isConnected) {
        // Assign leadership
        session.leaderId = currentUserId;
        const user = session.users.get(currentUserId);
        if (user) {
          user.isLeader = true;
        }

        // Update other users
        session.users.forEach((userInfo, userId) => {
          if (userId !== currentUserId && userInfo.isLeader) {
            userInfo.isLeader = false;
          }
        });

        // Notify all users about leadership change
        emitToSession(currentSessionId, 'leadership_changed', {
          newLeaderId: currentUserId,
          newLeaderName: user?.username,
          timestamp: Date.now()
        });

        await saveSessionToDb(session);
      } else {
        socket.emit('error', { message: 'Current leader is still active' });
      }
    } catch (error) {
      console.error('Error in request_leadership:', error);
      socket.emit('error', { message: 'Failed to request leadership' });
    }
  });

  // Handle desync recovery
  socket.on('report_desync', async (data) => {
    try {
      if (!currentSessionId || !currentUserId) {
        socket.emit('error', { message: 'Not in a session' });
        return;
      }

      const session = activeSessions.get(currentSessionId);
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      const { reportedPosition, reportedTime } = data;
      
      // Send current authoritative state back to the reporting user
      socket.emit('desync_recovery', {
        authoritativeState: {
          ...session.playbackState,
          position: session.getCurrentPlaybackPosition(),
          timestamp: Date.now()
        },
        reportedPosition,
        reportedTime
      });

      console.log(`Desync reported by user ${currentUserId} in session ${currentSessionId}`);
    } catch (error) {
      console.error('Error in report_desync:', error);
      socket.emit('error', { message: 'Failed to handle desync report' });
    }
  });

  // Request current session state
  socket.on('request_session_state', () => {
    if (!currentSessionId) {
      socket.emit('error', { message: 'Not in a session' });
      return;
    }

    const session = activeSessions.get(currentSessionId);
    if (!session) {
      socket.emit('error', { message: 'Session not found' });
      return;
    }

    socket.emit('session_state', session.serialize());
  });

  // Activity heartbeat
  socket.on('heartbeat', async () => {
    if (currentSessionId && currentUserId) {
      const session = activeSessions.get(currentSessionId);
      if (session) {
        const user = session.users.get(currentUserId);
        if (user) {
          user.lastSeen = Date.now();
          session.lastActivity = Date.now();
        }
      }
    }
    socket.emit('heartbeat_ack', { timestamp: Date.now() });
  });

  // Load media
  socket.on('load_media', async (data) => {
    try {
      if (!currentSessionId || !currentUserId) {
        socket.emit('error', { message: 'Not in a session' });
        return;
      }

      const session = activeSessions.get(currentSessionId);
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      if (session.leaderId !== currentUserId) {
        socket.emit('error', { message: 'Only the leader can load media' });
        return;
      }

      const { mediaUrl, mediaId, mediaTitle, mediaDuration } = data;
      
      // Update session with new media
      session.updatePlaybackState({
        mediaUrl,
        mediaId,
        position: 0,
        isPlaying: false
      });

      // Notify all users to load the new media
      emitToSession(currentSessionId, 'media_loaded', {
        mediaUrl,
        mediaId,
        mediaTitle,
        mediaDuration,
        timestamp: Date.now(),
        loadedBy: currentUserId
      });

      await saveSessionToDb(session);
    } catch (error) {
      console.error('Error in load_media:', error);
      socket.emit('error', { message: 'Failed to load media' });
    }
  });

  // Handle user disconnect
  const handleUserLeave = async () => {
    try {
      if (currentSessionId && currentUserId) {
        const session = activeSessions.get(currentSessionId);
        if (session) {
          // Mark user as disconnected
          const user = session.users.get(currentUserId);
          if (user) {
            user.isConnected = false;
            user.lastSeen = Date.now();
          }

          // Notify other users
          broadcastToSession(currentSessionId, 'user_left', {
            userId: currentUserId,
            username: user?.username,
            timestamp: Date.now()
          });

          // If no users are connected, optionally clean up session after a delay
          const connectedUsers = Array.from(session.users.values()).filter(u => u.isConnected);
          if (connectedUsers.length === 0) {
            console.log(`Session ${currentSessionId} has no connected users`);
            // Could implement cleanup logic here
          }

          await saveSessionToDb(session);
        }

        // Clean up mappings
        userSessions.delete(currentUserId);
        socket.leave(`session:${currentSessionId}`);
      }
    } catch (error) {
      console.error('Error in handleUserLeave:', error);
    }
  };

  socket.on('disconnect', async (reason) => {
    console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
    await handleUserLeave();
  });
});

// Cleanup inactive sessions periodically
setInterval(async () => {
  const now = Date.now();
  const CLEANUP_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours

  for (const [sessionId, session] of activeSessions.entries()) {
    // Remove sessions with no connected users that have been inactive for too long
    const connectedUsers = Array.from(session.users.values()).filter(u => u.isConnected);
    const isInactive = (now - session.lastActivity) > CLEANUP_THRESHOLD;
    
    if (connectedUsers.length === 0 && isInactive) {
      console.log(`Cleaning up inactive session: ${sessionId}`);
      activeSessions.delete(sessionId);
    }
  }
}, 60 * 60 * 1000); // Run every hour

server.listen(port, () => {
  console.log(`Shared Media Streaming server listening on port ${port}`);
  console.log(`Socket.IO server is ready for connections`);
});
