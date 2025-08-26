import AWS from 'aws-sdk';
import { IFileUploadService } from '../../domain/services/ifile-upload.service';

export class S3UploadService implements IFileUploadService {
	private s3: AWS.S3;
	private bucket: string;

	constructor() {
		this.bucket = process.env.S3_BUCKET || 'shared-media-streaming';
		this.s3 = new AWS.S3({
			accessKeyId: process.env.S3_USER_KEY,
			secretAccessKey: process.env.S3_SECRET,
			region: process.env.S3_REGION || 'us-east-1',
		});
	}

	async uploadFile(
		file: Buffer,
		filename: string,
		mimeType: string,
	): Promise<{
		url: string;
		key: string;
		bucket: string;
	}> {
		const key = `uploads/media/${Date.now()}-${filename}`;

		const uploadParams: AWS.S3.PutObjectRequest = {
			Bucket: this.bucket,
			Key: key,
			Body: file,
			ContentType: mimeType,
			// ACL removed - bucket has ACLs disabled
		};

		await this.s3.upload(uploadParams).promise();

		const url = `https://${this.bucket}.s3.${process.env.S3_REGION || 'us-east-1'}.amazonaws.com/${key}`;

		return {
			url,
			key,
			bucket: this.bucket,
		};
	}

	async deleteFile(key: string): Promise<boolean> {
		try {
			await this.s3
				.deleteObject({
					Bucket: this.bucket,
					Key: key,
				})
				.promise();
			return true;
		} catch (error) {
			console.error('Failed to delete file from S3:', error);
			return false;
		}
	}

	async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
		const params = {
			Bucket: this.bucket,
			Key: key,
			Expires: expiresIn,
		};

		return this.s3.getSignedUrl('getObject', params);
	}

	async uploadThumbnail(thumbnailBuffer: Buffer, filename: string): Promise<string> {
		const key = `uploads/thumbnails/${Date.now()}-${filename}`;

		const uploadParams: AWS.S3.PutObjectRequest = {
			Bucket: this.bucket,
			Key: key,
			Body: thumbnailBuffer,
			ContentType: 'image/jpeg',
			// ACL removed - bucket has ACLs disabled
		};

		await this.s3.upload(uploadParams).promise();

		const url = `https://${this.bucket}.s3.${process.env.S3_REGION || 'us-east-1'}.amazonaws.com/${key}`;

		return url;
	}

	async deleteThumbnail(thumbnailUrl: string): Promise<boolean> {
		try {
			// Extract key from URL
			const urlParts = thumbnailUrl.split('/');
			const key = urlParts.slice(-2).join('/'); // thumbnails/filename

			await this.s3
				.deleteObject({
					Bucket: this.bucket,
					Key: key,
				})
				.promise();
			return true;
		} catch (error) {
			console.error('Failed to delete thumbnail from S3:', error);
			return false;
		}
	}
}
