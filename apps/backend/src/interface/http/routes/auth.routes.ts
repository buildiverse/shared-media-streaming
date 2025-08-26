import { Router } from 'express';
import { IAuthService } from '../../../domain/services/iauth.service';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export const createAuthRoutes = (authController: AuthController, authService: IAuthService) => {
	const router = Router();

	// Public routes
	router.post('/login', authController.login.bind(authController));
	router.post('/refresh-token', authController.refreshToken.bind(authController));

	// Protected routes (require authentication)
	router.post('/logout', authMiddleware(authService), authController.logout.bind(authController));

	return router;
};
