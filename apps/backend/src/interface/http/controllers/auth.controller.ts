import { Request, Response } from 'express';
import { LoginUseCase } from '../../../application/use-cases/login.usecase';
import { LogoutUseCase } from '../../../application/use-cases/logout.usecase';
import { RefreshTokenUseCase } from '../../../application/use-cases/refresh-token.usecase';
import { ILoggingService } from '../../../domain/services/ilogging.service';
import { loginSchema, logoutSchema, refreshTokenSchema } from '../validators/auth.validation';

export class AuthController {
	constructor(
		private loginUseCase: LoginUseCase,
		private refreshTokenUseCase: RefreshTokenUseCase,
		private logoutUseCase: LogoutUseCase,
		private loggingService: ILoggingService,
	) {}

	async login(req: Request, res: Response) {
		try {
			// Validate input
			const validation = loginSchema.safeParse(req);
			if (!validation.success) {
				return res.status(400).json({
					success: false,
					message: 'Validation failed',
					errors: validation.error.issues,
				});
			}

			const { username, password } = validation.data.body;

			const result = await this.loginUseCase.execute({
				username,
				password,
				userAgent: req.get('User-Agent'),
				ipAddress: req.ip,
			});

			this.loggingService.info('User logged in successfully', {
				userId: result.user.id,
				username: result.user.username,
				ip: req.ip,
				requestId: req.requestId,
			});

			res.json({
				success: true,
				message: 'Login successful',
				data: {
					user: {
						id: result.user.id,
						username: result.user.username,
						email: result.user.email,
					},
					accessToken: result.accessToken,
					refreshToken: result.refreshToken,
				},
			});
		} catch (error) {
			this.loggingService.error('Login failed', error, {
				username: req.body.username,
				ip: req.ip,
				requestId: req.requestId,
			});

			if (error instanceof Error) {
				return res.status(401).json({
					success: false,
					message: error.message,
				});
			}

			res.status(500).json({
				success: false,
				message: 'Login failed',
			});
		}
	}

	async logout(req: Request, res: Response) {
		try {
			// Validate the request body
			const validation = logoutSchema.safeParse(req);
			if (!validation.success) {
				return res.status(400).json({
					success: false,
					message: 'Validation failed',
					errors: validation.error.issues,
				});
			}

			const { allDevices = false } = validation.data.body || {};

			// Execute the logout use case
			const result = await this.logoutUseCase.execute({
				userId: req.user!.userId, // From auth middleware
				userAgent: req.get('User-Agent'),
				ipAddress: req.ip,
				allDevices,
			});

			this.loggingService.info('User logged out successfully', {
				userId: req.user!.userId,
				username: req.user!.username,
				ip: req.ip,
				requestId: req.requestId,
				tokensRevoked: result.tokensRevoked,
				allDevices,
			});

			res.json({
				success: true,
				message: result.message,
				data: {
					tokensRevoked: result.tokensRevoked,
				},
			});
		} catch (error) {
			this.loggingService.error('Logout failed', error, {
				userId: req.user?.userId,
				ip: req.ip,
				requestId: req.requestId,
			});

			res.status(500).json({
				success: false,
				message: 'Logout failed',
			});
		}
	}

	async refreshToken(req: Request, res: Response) {
		try {
			// Validate the request body
			const validation = refreshTokenSchema.safeParse(req);
			if (!validation.success) {
				return res.status(400).json({
					success: false,
					message: 'Validation failed',
					errors: validation.error.issues,
				});
			}

			const { refreshToken } = validation.data.body;

			// Execute the refresh token use case
			const result = await this.refreshTokenUseCase.execute({
				refreshToken,
				userAgent: req.get('User-Agent'),
				ipAddress: req.ip,
			});

			this.loggingService.info('Token refreshed successfully', {
				userId: result.user.id,
				username: result.user.username,
				ip: req.ip,
				requestId: req.requestId,
			});

			res.json({
				accessToken: result.accessToken,
				refreshToken: result.refreshToken,
			});
		} catch (error) {
			this.loggingService.error('Token refresh failed', error, {
				ip: req.ip,
				requestId: req.requestId,
			});

			if (error instanceof Error) {
				return res.status(401).json({
					success: false,
					message: error.message,
				});
			}

			res.status(500).json({
				success: false,
				message: 'Token refresh failed',
			});
		}
	}
}
