class MediaSession {
  constructor(sessionId, creatorId) {
    this.sessionId = sessionId;
    this.creatorId = creatorId;
    this.leaderId = creatorId;
    this.users = new Map(); // userId -> userInfo
    this.playbackState = {
      mediaUrl: null,
      mediaId: null,
      position: 0,
      isPlaying: false,
      lastUpdateTime: Date.now(),
      playbackRate: 1.0
    };
    this.createdAt = new Date();
    this.lastActivity = Date.now();
  }

  addUser(userId, userInfo) {
    this.users.set(userId, {
      ...userInfo,
      joinedAt: new Date(),
      lastSeen: Date.now(),
      isConnected: true
    });
    this.lastActivity = Date.now();
  }

  removeUser(userId) {
    this.users.delete(userId);
    this.lastActivity = Date.now();
    
    // If leader leaves, assign new leader
    if (this.leaderId === userId && this.users.size > 0) {
      this.leaderId = this.users.keys().next().value;
    }
  }

  updatePlaybackState(newState, timestamp = Date.now()) {
    this.playbackState = {
      ...this.playbackState,
      ...newState,
      lastUpdateTime: timestamp
    };
    this.lastActivity = timestamp;
  }

  getCurrentPlaybackPosition() {
    const now = Date.now();
    const timeDiff = (now - this.playbackState.lastUpdateTime) / 1000;
    
    if (this.playbackState.isPlaying) {
      return this.playbackState.position + (timeDiff * this.playbackState.playbackRate);
    }
    return this.playbackState.position;
  }

  serialize() {
    return {
      sessionId: this.sessionId,
      creatorId: this.creatorId,
      leaderId: this.leaderId,
      users: Array.from(this.users.entries()).map(([id, info]) => ({ id, ...info })),
      playbackState: {
        ...this.playbackState,
        position: this.getCurrentPlaybackPosition()
      },
      createdAt: this.createdAt,
      lastActivity: this.lastActivity,
      userCount: this.users.size
    };
  }
}

module.exports = { MediaSession };