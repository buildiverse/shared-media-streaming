import { Router } from 'express';
import { IAuthService } from '../../../domain/services/iauth.service';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export const createUserRoutes = (userController: UserController, authService: IAuthService) => {
	const router = Router();

	// Public routes
	router.post('/signup', userController.signUp.bind(userController));
	router.get('/check-username/:username', userController.checkUsernameExists.bind(userController));
	router.get('/check-email/:email', userController.checkEmailExists.bind(userController));

	// Protected routes
	router.get(
		'/profile',
		authMiddleware(authService),
		userController.getProfile.bind(userController),
	);

	return router;
};
