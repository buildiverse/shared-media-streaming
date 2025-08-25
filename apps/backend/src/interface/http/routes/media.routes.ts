import { Router } from 'express';
import multer from 'multer';
import { IAuthService } from '../../../domain/services/iauth.service';
import { MediaController } from '../controllers/media.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

// Configure multer for memory storage (for S3 uploads)
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 500 * 1024 * 1024, // 500MB limit
	},
	fileFilter: (_req, file, cb) => {
		// Allow video, audio, and image files
		if (
			file.mimetype.startsWith('video/') ||
			file.mimetype.startsWith('audio/') ||
			file.mimetype.startsWith('image/')
		) {
			cb(null, true);
		} else {
			cb(new Error('Unsupported file type'));
		}
	},
});

export const createMediaRoutes = (mediaController: MediaController, authService: IAuthService) => {
	const router = Router();

	// All media routes require authentication
	router.use(authMiddleware(authService));

	// Upload media (single file)
	router.post('/upload', upload.single('media'), mediaController.uploadMedia.bind(mediaController));

	// Get user's media
	router.get('/my-media', mediaController.getUserMedia.bind(mediaController));

	// Get specific media by ID
	router.get('/:id', mediaController.getMediaById.bind(mediaController));

	// Delete media
	router.delete('/:id', mediaController.deleteMedia.bind(mediaController));

	return router;
};
