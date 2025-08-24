import mongoose from 'mongoose';
import { LogLevel } from '../types/log.types';

const logSchema = new mongoose.Schema({
	level: {
		type: String,
		enum: Object.values(LogLevel),
		required: true,
	},
	message: {
		type: String,
		required: true,
	},
	details: {
		type: mongoose.Schema.Types.Mixed,
	},
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
	},
	roomId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Room',
	},
	ip: { type: String },
	userAgent: { type: String },
	requestId: { type: String },
	stacktrace: { type: String },
	timestamp: { type: Date, default: Date.now },
});

logSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
logSchema.index({ level: 1, timestamp: -1 });

export default mongoose.model('Log', logSchema);
