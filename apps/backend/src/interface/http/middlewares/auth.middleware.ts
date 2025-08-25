import { NextFunction, Request, Response } from 'express';
import { IAuthService } from '../../../domain/services/iauth.service';

// Extend Express Request interface to include user and requestId
declare global {
	namespace Express {
		interface Request {
			user?: {
				userId: string;
				username: string;
			};
			requestId: string;
		}
	}
}

/**
 * Authentication middleware for protected routes
 * Verifies JWT access token and attaches user info to req.user
 */
export function authMiddleware(authService: IAuthService) {
	return async (req: Request, res: Response, next: NextFunction) => {
		try {
			const authHeader = req.headers.authorization;

			if (!authHeader || !authHeader.startsWith('Bearer ')) {
				return res.status(401).json({
					success: false,
					message: 'Access token required',
				});
			}

			const token = authHeader.substring(7);
			const payload = authService.verifyAccessToken(token);

			if (!payload) {
				return res.status(401).json({
					success: false,
					message: 'Invalid or expired access token',
				});
			}

			// Attach user info to request
			req.user = {
				userId: payload.userId,
				username: payload.username,
			};

			next();
		} catch (error) {
			return res.status(401).json({
				success: false,
				message: 'Authentication failed',
			});
		}
	};
}
