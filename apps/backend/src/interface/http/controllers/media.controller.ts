import { Request, Response } from 'express';
import { DeleteMediaUseCase } from '../../../application/use-cases/delete-media.usecase';
import { GetMediaByIdUseCase } from '../../../application/use-cases/get-media-by-id.usecase';
import { GetUserMediaUseCase } from '../../../application/use-cases/get-user-media.usecase';
import { UploadMediaUseCase } from '../../../application/use-cases/upload-media.usecase';
import { ILoggingService } from '../../../domain/services/ilogging.service';
import { uploadMediaSchema } from '../validators/media.validation';

export class MediaController {
	constructor(
		private uploadMediaUseCase: UploadMediaUseCase,
		private getUserMediaUseCase: GetUserMediaUseCase,
		private getMediaByIdUseCase: GetMediaByIdUseCase,
		private deleteMediaUseCase: DeleteMediaUseCase,
		private loggingService: ILoggingService,
	) {}

	async uploadMedia(req: Request, res: Response) {
		try {
			if (!req.file) {
				return res.status(400).json({
					success: false,
					message: 'No file uploaded',
				});
			}

			// Validate input
			const validation = uploadMediaSchema.safeParse(req);
			if (!validation.success) {
				return res.status(400).json({
					success: false,
					message: 'Validation failed',
					errors: validation.error.issues,
				});
			}

			const { title, description } = validation.data.body;
			const userId = req.user?.userId;

			if (!userId) {
				return res.status(401).json({
					success: false,
					message: 'User not authenticated',
				});
			}

			// Validation is now handled in the use case

			// Execute use case
			const result = await this.uploadMediaUseCase.execute({
				title,
				description,
				file: req.file.buffer,
				originalName: req.file.originalname,
				mimeType: req.file.mimetype,
				size: req.file.size,
				duration: 0, // TODO: Extract actual duration from video/audio files
				uploadedBy: userId,
			});

			this.loggingService.info('Media uploaded successfully', {
				mediaId: result.media.id,
				title: result.media.title,
				userId,
				fileSize: result.media.getFileSizeInMB(),
				requestId: req.requestId,
			});

			res.status(201).json({
				success: true,
				message: 'Media uploaded successfully',
				media: {
					id: result.media.id,
					title: result.media.title,
					description: result.media.description,
					filename: result.media.filename,
					originalName: result.media.originalName,
					mimeType: result.media.mimeType,
					size: result.media.size,
					duration: result.media.duration,
					url: result.media.url,
					uploadedBy: result.media.uploadedBy,
					thumbnails: result.media.thumbnails,
					createdAt: result.media.createdAt,
				},
			});
		} catch (error) {
			this.loggingService.error('Media upload failed', error, {
				userId: req.user?.userId,
				requestId: req.requestId,
			});

			// Handle storage limit exceeded error specifically
			if (error instanceof Error && error.message.includes('Storage limit exceeded')) {
				return res.status(400).json({
					success: false,
					message: error.message,
				});
			}

			res.status(500).json({
				success: false,
				message: 'Media upload failed',
			});
		}
	}

	async getUserMedia(req: Request, res: Response) {
		try {
			const userId = req.user?.userId;
			if (!userId) {
				return res.status(401).json({
					success: false,
					message: 'User not authenticated',
				});
			}

			// Get query parameters for pagination and filtering
			const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
			const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
			const type = (req.query.type as 'video' | 'audio' | 'image' | 'all') || 'all';

			// Execute use case
			const result = await this.getUserMediaUseCase.execute({
				userId,
				limit,
				offset,
				type,
			});

			this.loggingService.info('User media retrieved', {
				userId,
				mediaCount: result.media.length,
				total: result.total,
				hasMore: result.hasMore,
				requestId: req.requestId,
			});

			res.json({
				success: true,
				media: result.media.map((m) => ({
					id: m.id,
					title: m.title,
					description: m.description,
					filename: m.filename,
					originalName: m.originalName,
					mimeType: m.mimeType,
					size: m.size,
					duration: m.duration,
					url: m.url,
					uploadedBy: m.uploadedBy,
					thumbnails: m.thumbnails,
					createdAt: m.createdAt,
				})),
				pagination: {
					total: result.total,
					hasMore: result.hasMore,
					limit,
					offset,
				},
			});
		} catch (error) {
			this.loggingService.error('Failed to get user media', error, {
				userId: req.user?.userId,
				requestId: req.requestId,
			});

			res.status(500).json({
				success: false,
				message: 'Failed to get user media',
			});
		}
	}

	async getMediaById(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const userId = req.user?.userId;

			// Execute use case
			const result = await this.getMediaByIdUseCase.execute({
				mediaId: id,
				userId,
			});

			if (!result.success || !result.media) {
				return res.status(404).json({
					success: false,
					message: 'Media not found',
				});
			}

			const media = result.media;

			this.loggingService.info('Media retrieved', {
				mediaId: media.id,
				userId: req.user?.userId,
				requestId: req.requestId,
			});

			res.json({
				success: true,
				media: {
					id: media.id,
					title: media.title,
					description: media.description,
					filename: media.filename,
					originalName: media.originalName,
					mimeType: media.mimeType,
					size: media.size,
					duration: media.duration,
					url: media.url,
					uploadedBy: media.uploadedBy,
					thumbnails: media.thumbnails,
					createdAt: media.createdAt,
				},
			});
		} catch (error) {
			this.loggingService.error('Failed to get media', error, {
				mediaId: req.params.id,
				userId: req.user?.userId,
				requestId: req.requestId,
			});

			res.status(500).json({
				success: false,
				message: 'Failed to get media',
			});
		}
	}

	async deleteMedia(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const userId = req.user?.userId;

			if (!userId) {
				return res.status(401).json({
					success: false,
					message: 'User not authenticated',
				});
			}

			// Execute use case
			const result = await this.deleteMediaUseCase.execute({
				mediaId: id,
				userId,
			});

			if (!result.success) {
				return res.status(400).json({
					success: false,
					message: result.message,
				});
			}

			this.loggingService.info('Media deleted successfully', {
				mediaId: id,
				userId,
				requestId: req.requestId,
			});

			res.json({
				success: true,
				message: result.message,
			});
		} catch (error) {
			this.loggingService.error('Failed to delete media', error, {
				mediaId: req.params.id,
				userId: req.user?.userId,
				requestId: req.requestId,
			});

			res.status(500).json({
				success: false,
				message: 'Failed to delete media',
			});
		}
	}
}
