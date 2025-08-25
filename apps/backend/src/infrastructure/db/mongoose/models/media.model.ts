import mongoose, { Document, Schema } from 'mongoose';

export interface IMediaDocument extends Document {
	title: string;
	description: string;
	filename: string;
	originalName: string;
	mimeType: string;
	size: number;
	duration: number;
	url: string;
	s3Key: string;
	uploadedBy: string;
	createdAt: Date;
	updatedAt: Date;
}

const mediaSchema = new Schema<IMediaDocument>(
	{
		title: {
			type: String,
			required: true,
			minlength: 1,
			maxlength: 100,
		},
		description: {
			type: String,
			required: false,
			maxlength: 500,
		},
		filename: {
			type: String,
			required: true,
		},
		originalName: {
			type: String,
			required: true,
		},
		mimeType: {
			type: String,
			required: true,
		},
		size: {
			type: Number,
			required: true,
			min: 0,
		},
		duration: {
			type: Number,
			required: true,
			min: 0,
		},
		url: {
			type: String,
			required: true,
		},
		s3Key: {
			type: String,
			required: true,
		},
		uploadedBy: {
			type: String,
			required: true,
			index: true,
		},
	},
	{
		timestamps: true,
	},
);

// Indexes
mediaSchema.index({ title: 'text', description: 'text' }); // Text search
mediaSchema.index({ mimeType: 1 });
mediaSchema.index({ createdAt: -1 });
mediaSchema.index({ size: 1 });

export const MediaModel = mongoose.model<IMediaDocument>('Media', mediaSchema);
