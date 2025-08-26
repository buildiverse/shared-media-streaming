import crypto from 'crypto';
import { ITokenRepository } from '../../domain/repositories/itoken.repository';
import { IUserRepository } from '../../domain/repositories/iuser.repository';
import { IAuthService } from '../../domain/services/iauth.service';

export interface RefreshTokenInput {
	refreshToken: string;
	userAgent?: string;
	ipAddress?: string;
}

export interface RefreshTokenResult {
	accessToken: string;
	refreshToken: string;
	user: {
		id: string;
		username: string;
		email: string;
	};
}

export class RefreshTokenUseCase {
	constructor(
		private tokenRepository: ITokenRepository,
		private userRepository: IUserRepository,
		private authService: IAuthService,
	) {}

	async execute(input: RefreshTokenInput): Promise<RefreshTokenResult> {
		// Verify the refresh token
		const tokenPayload = this.authService.verifyRefreshToken(input.refreshToken);
		if (!tokenPayload) {
			throw new Error('Invalid refresh token');
		}

		// Find the stored refresh token
		const storedToken = await this.tokenRepository.findByTokenId(tokenPayload.tokenId);
		if (!storedToken) {
			throw new Error('Refresh token not found');
		}

		// Check if token is valid and not expired
		if (!storedToken.isValid()) {
			throw new Error('Refresh token expired or revoked');
		}

		// Verify the token matches what's stored
		if (storedToken.refreshToken !== input.refreshToken) {
			throw new Error('Refresh token mismatch');
		}

		// Get the user
		const user = await this.userRepository.findById(tokenPayload.userId);
		if (!user) {
			throw new Error('User not found');
		}

		// Revoke the old refresh token
		await this.tokenRepository.revoke(tokenPayload.tokenId);

		// Generate new tokens
		const newTokenId = crypto.randomUUID();
		const newAccessToken = this.authService.generateAccessToken(user.id, user.username);
		const newRefreshToken = this.authService.generateRefreshToken(user.id, newTokenId);

		// Store the new refresh token
		await this.tokenRepository.create({
			userId: user.id,
			tokenId: newTokenId,
			refreshToken: newRefreshToken,
			isRevoked: false,
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
			userAgent: input.userAgent,
			ipAddress: input.ipAddress,
		});

		// Update user's last active time
		await this.userRepository.updateLastActive(user.id);

		return {
			accessToken: newAccessToken,
			refreshToken: newRefreshToken,
			user: {
				id: user.id,
				username: user.username,
				email: user.email,
			},
		};
	}
}
