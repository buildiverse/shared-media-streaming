import mongoose, { Document, Schema } from 'mongoose';

export interface IRoomDocument extends Document {
	id: string;
	roomCode: string;
	isPrivate: boolean;
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
}

const roomSchema = new Schema<IRoomDocument>(
	{
		roomCode: {
			type: String,
			required: true,
			unique: true,
			length: 8,
			uppercase: true,
		},
		isPrivate: {
			type: Boolean,
			default: false,
		},
		createdBy: {
			type: String,
			required: true,
			ref: 'User',
		},
	},
	{
		timestamps: true,
		toJSON: {
			transform: (_doc, ret: any) => {
				ret.id = ret._id;
				delete ret._id;
				delete ret.__v;
				return ret;
			},
		},
	},
);

// Indexes for performance
roomSchema.index({ roomCode: 1 });
roomSchema.index({ createdBy: 1 });
roomSchema.index({ isPrivate: 1 });

export const RoomModel = mongoose.model<IRoomDocument>('Room', roomSchema);
