import { Router } from 'express';
import { IAuthService } from '../../../domain/services/iauth.service';
import { StorageController } from '../controllers/storage.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { rateLimiterConfig } from '../middlewares/configurations/rateLimit.config';

export const createStorageRoutes = (
	storageController: StorageController,
	authService: IAuthService,
) => {
	const router = Router();

	// Public routes (no authentication required, but rate limited)
	router.get(
		'/pricing',
		rateLimiterConfig,
		storageController.getPricingTiers.bind(storageController),
	);
	router.post('/webhook', storageController.handleWebhook.bind(storageController));

	// Protected routes (authentication required)
	router.use(authMiddleware(authService));
	router.get('/stats', storageController.getUserStorageStats.bind(storageController));
	router.post('/checkout', storageController.createCheckoutSession.bind(storageController));

	return router;
};
