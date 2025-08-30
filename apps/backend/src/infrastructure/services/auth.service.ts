import jwt from 'jsonwebtoken';
import { IAuthService } from '../../domain/services/iauth.service';

export class AuthService implements IAuthService {
	verifyAccessToken(token: string): { userId: string; username: string } | null {
		try {
			const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;
			return {
				userId: payload.userId,
				username: payload.username,
			};
		} catch (error) {
			return null;
		}
	}

	verifyRefreshToken(token: string): { userId: string; tokenId: string } | null {
		try {
			const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any;
			return {
				userId: payload.userId,
				tokenId: payload.tokenId,
			};
		} catch (error) {
			return null;
		}
	}

	generateAccessToken(userId: string, username: string): string {
		const payload = {
			userId,
			username,
		};

		return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
			expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
		} as any);
	}

	generateRefreshToken(userId: string, tokenId: string): string {
		const payload = {
			userId,
			tokenId,
		};

		return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
			expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
		} as any);
	}
}
