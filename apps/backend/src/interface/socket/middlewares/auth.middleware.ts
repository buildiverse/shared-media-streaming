import { Socket } from 'socket.io';
import { IAuthService } from '../../../domain/services/iauth.service';

export interface AuthenticatedSocket extends Socket {
	user?: {
		userId: string;
		username: string;
	};
}

export function socketAuthMiddleware(authService: IAuthService) {
	return (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
		const token = socket.handshake.auth.token || socket.handshake.headers.authorization;

		if (!token) {
			return next(new Error('Authentication token required'));
		}

		try {
			// Remove 'Bearer ' prefix if present
			const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
			const payload = authService.verifyAccessToken(cleanToken);

			if (!payload) {
				return next(new Error('Invalid or expired token'));
			}

			// Attach user info to socket
			socket.user = {
				userId: payload.userId,
				username: payload.username,
			};

			next();
		} catch (error) {
			next(new Error('Authentication failed'));
		}
	};
}
