import mongoose, { Document, Schema } from 'mongoose';

export interface IUserDocument extends Document {
	username: string;
	email: string;
	password: string;
	avatarUrl?: string;
	createdAt: Date;
	lastActiveAt: Date;
	updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
	{
		username: {
			type: String,
			required: true,
			unique: true,
			minlength: 3,
			maxlength: 30,
			match: /^[a-zA-Z0-9_-]+$/,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
		},
		password: {
			type: String,
			required: true,
			minlength: 8,
		},
		avatarUrl: {
			type: String,
			required: false,
		},
		lastActiveAt: {
			type: Date,
			default: Date.now,
		},
	},
	{
		timestamps: true,
	},
);

// Additional indexes (username and email are already indexed via unique: true)
userSchema.index({ lastActiveAt: 1 });

export const UserModel = mongoose.model<IUserDocument>('User', userSchema);
