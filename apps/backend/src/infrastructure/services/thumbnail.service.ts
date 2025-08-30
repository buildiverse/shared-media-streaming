import { spawn } from 'child_process';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { IThumbnailService } from '../../domain/services/ithumbnail.service';
import { S3UploadService } from './s3-upload.service';

export class ThumbnailService implements IThumbnailService {
	constructor(private readonly s3UploadService: S3UploadService) {}

	async generateThumbnails(
		videoBuffer: Buffer,
		filename: string,
		mimeType: string,
	): Promise<string[]> {
		// Only generate thumbnails for video files
		if (!mimeType.startsWith('video/')) {
			return [];
		}

		try {
			// Create temporary file paths
			const tempDir = tmpdir();
			const videoPath = join(tempDir, `temp_${Date.now()}_${filename}`);
			const thumbnailDir = join(tempDir, `thumbnails_${Date.now()}`);

			// Create thumbnail directory if it doesn't exist
			if (!existsSync(thumbnailDir)) {
				mkdirSync(thumbnailDir, { recursive: true });
			}

			// Write video buffer to temp file
			writeFileSync(videoPath, videoBuffer);

			// Debug: Check if file was written and get file size
			console.log(`Video temp file created: ${videoPath}`);
			console.log(`Video file size: ${videoBuffer.length} bytes`);

			// Generate thumbnails at different timestamps
			const thumbnails = await this.generateThumbnailsWithFFmpeg(videoPath, thumbnailDir, filename);

			// Clean up temp files
			try {
				unlinkSync(videoPath);
			} catch (cleanupError) {
				console.warn('Failed to clean up temp video file:', cleanupError);
			}

			return thumbnails;
		} catch (error) {
			console.error('Failed to generate thumbnails:', error);
			return [];
		}
	}

	private async generateThumbnailsWithFFmpeg(
		videoPath: string,
		thumbnailDir: string,
		filename: string,
	): Promise<string[]> {
		return new Promise((resolve) => {
			// Use percentage-based timestamps that work with any video length
			const thumbnailUrls: string[] = [];
			let completedCount = 0;

			// Generate 4 thumbnails at different points
			for (let i = 0; i < 4; i++) {
				const thumbnailPath = join(thumbnailDir, `thumb_${i}_${filename}.jpg`);

				// FFmpeg command to extract thumbnail at percentage of video
				const ffmpeg = spawn('ffmpeg', [
					'-i',
					videoPath,
					'-ss',
					`${i * 0.25}`, // 0%, 25%, 50%, 75% of video
					'-vframes',
					'1',
					'-q:v',
					'2',
					'-vf',
					'scale=320:240',
					thumbnailPath,
					'-y',
				]);

				// Capture stderr for debugging
				ffmpeg.stderr.on('data', (data) => {
					console.log(`FFmpeg stderr for thumbnail ${i}:`, data.toString());
				});

				ffmpeg.on('close', async (code) => {
					if (code === 0) {
						try {
							// Read the generated thumbnail and upload to S3
							const thumbnailBuffer = require('fs').readFileSync(thumbnailPath);
							const thumbnailUrl = await this.s3UploadService.uploadThumbnail(
								thumbnailBuffer,
								`thumb_${i}_${filename}.jpg`,
							);
							thumbnailUrls.push(thumbnailUrl);

							// Clean up temp thumbnail file
							try {
								unlinkSync(thumbnailPath);
							} catch (cleanupError) {
								console.warn('Failed to clean up temp thumbnail file:', cleanupError);
							}
						} catch (uploadError) {
							console.error('Failed to upload thumbnail:', uploadError);
						}
					} else {
						console.error(`FFmpeg failed with code ${code} for thumbnail ${i}`);
					}

					completedCount++;
					if (completedCount === 4) {
						resolve(thumbnailUrls);
					}
				});

				ffmpeg.on('error', (error) => {
					console.error('FFmpeg error:', error);
					completedCount++;
					if (completedCount === 4) {
						resolve(thumbnailUrls);
					}
				});
			}
		});
	}
}
