import mongoose, { Document, Schema } from 'mongoose';

export interface ITokenDocument extends Document {
	userId: string;
	tokenId: string;
	refreshToken: string;
	isRevoked: boolean;
	expiresAt: Date;
	userAgent?: string;
	ipAddress?: string;
	createdAt: Date;
}

const tokenSchema = new Schema<ITokenDocument>(
	{
		userId: {
			type: String,
			required: true,
		},
		tokenId: {
			type: String,
			required: true,
			unique: true,
		},
		refreshToken: {
			type: String,
			required: true,
		},
		isRevoked: {
			type: Boolean,
			default: false,
		},
		expiresAt: {
			type: Date,
			required: true,
		},
		userAgent: {
			type: String,
			required: false,
		},
		ipAddress: {
			type: String,
			required: false,
		},
	},
	{
		timestamps: true,
	},
);

// Composite and TTL indexes (unique fields are auto-indexed)
tokenSchema.index({ userId: 1, isRevoked: 1 });
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export const TokenModel = mongoose.model<ITokenDocument>('RefreshToken', tokenSchema);
