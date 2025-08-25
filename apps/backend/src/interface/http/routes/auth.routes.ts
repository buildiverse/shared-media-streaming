import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

export const createAuthRoutes = (authController: AuthController) => {
	const router = Router();

	// Public routes
	router.post('/login', authController.login.bind(authController));
	router.post('/refresh-token', authController.refreshToken.bind(authController));

	// Protected routes (will add auth middleware later)
	router.post('/logout', authController.logout.bind(authController));

	return router;
};
