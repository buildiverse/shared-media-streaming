import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
	username: { type: String, required: true },
	email: { type: String },
	password: { type: String },
	avatarUrl: { type: String },
	createdAt: { type: Date, default: Date.now },
	lastActiveAt: { type: Date },
});

userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

export default mongoose.model('User', userSchema);
