import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  hostUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
  playback: {
    state: { type: String, enum: ['playing', 'paused'], default: 'paused' },
    currentTime: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now }
  },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }
});

export default mongoose.model('Room', roomSchema);
