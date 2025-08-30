import { Request, Response } from 'express';
import { CreateUserUseCase } from '../../../application/use-cases/create-user.usecase';
import { IUserRepository } from '../../../domain/repositories/iuser.repository';
import { ILoggingService } from '../../../domain/services/ilogging.service';
import {
	checkEmailSchema,
	checkUsernameSchema,
	createUserSchema,
} from '../validators/user.validation';

export class UserController {
	constructor(
		private createUserUseCase: CreateUserUseCase,
		private userRepository: IUserRepository,
		private loggingService: ILoggingService,
	) {}

	async signUp(req: Request, res: Response) {
		try {
			// Validate input
			const validation = createUserSchema.safeParse(req);
			if (!validation.success) {
				return res.status(400).json({
					success: false,
					message: 'Validation failed',
					errors: validation.error.issues,
				});
			}

			const user = await this.createUserUseCase.execute(validation.data.body);

			this.loggingService.info('User account created', {
				userId: user.id,
				username: user.username,
				requestId: req.requestId,
			});

			res.status(201).json({
				success: true,
				message: 'User account created successfully',
				user: {
					id: user.id,
					username: user.username,
					email: user.email,
					createdAt: user.createdAt,
				},
			});
		} catch (error) {
			this.loggingService.error('Failed to create user account', error, {
				username: req.body.username,
				email: req.body.email,
				requestId: req.requestId,
			});

			if (error instanceof Error) {
				return res.status(400).json({
					success: false,
					message: error.message,
				});
			}

			res.status(500).json({
				success: false,
				message: 'Failed to create user account',
			});
		}
	}

	async checkUsernameExists(req: Request, res: Response) {
		try {
			// Validate params
			const validation = checkUsernameSchema.safeParse(req);
			if (!validation.success) {
				return res.status(400).json({
					success: false,
					message: 'Validation failed',
					errors: validation.error.issues,
				});
			}

			const { username } = validation.data.params;
			const exists = await this.userRepository.checkUsernameExists(username);

			this.loggingService.info('Username availability checked', {
				username,
				exists,
				requestId: req.requestId,
			});

			res.json({
				success: true,
				username,
				exists,
			});
		} catch (error) {
			this.loggingService.error('Failed to check username availability', error, {
				username: req.params.username,
				requestId: req.requestId,
			});

			res.status(500).json({
				success: false,
				message: 'Failed to check username availability',
			});
		}
	}

	async checkEmailExists(req: Request, res: Response) {
		try {
			// Validate params
			const validation = checkEmailSchema.safeParse(req);
			if (!validation.success) {
				return res.status(400).json({
					success: false,
					message: 'Validation failed',
					errors: validation.error.issues,
				});
			}

			const { email } = validation.data.params;
			const exists = await this.userRepository.checkEmailExists(email);

			this.loggingService.info('Email availability checked', {
				email,
				exists,
				requestId: req.requestId,
			});

			res.json({
				success: true,
				email,
				exists,
			});
		} catch (error) {
			this.loggingService.error('Failed to check email availability', error, {
				email: req.params.email,
				requestId: req.requestId,
			});

			res.status(500).json({
				success: false,
				message: 'Failed to check email availability',
			});
		}
	}

	async getProfile(req: Request, res: Response) {
		try {
			const userId = req.user?.userId;
			if (!userId) {
				return res.status(401).json({
					success: false,
					message: 'User not authenticated',
				});
			}

			const user = await this.userRepository.findById(userId);
			if (!user) {
				return res.status(404).json({
					success: false,
					message: 'User not found',
				});
			}

			this.loggingService.info('User profile retrieved', {
				userId,
				requestId: req.requestId,
			});

			res.json({
				success: true,
				user: {
					id: user.id,
					username: user.username,
					email: user.email,
					avatarUrl: user.avatarUrl,
					createdAt: user.createdAt,
					lastActiveAt: user.lastActiveAt,
				},
			});
		} catch (error) {
			this.loggingService.error('Failed to get user profile', error, {
				userId: req.user?.userId,
				requestId: req.requestId,
			});

			res.status(500).json({
				success: false,
				message: 'Failed to get user profile',
			});
		}
	}
}
