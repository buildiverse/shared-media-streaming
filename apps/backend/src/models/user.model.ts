import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String },
  password: { type: String },
  avatarUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date }
});

export default mongoose.model('User', userSchema);
