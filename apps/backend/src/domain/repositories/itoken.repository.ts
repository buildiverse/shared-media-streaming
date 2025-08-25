import { RefreshToken } from '../entities/refresh-token.entity';

export interface ITokenRepository {
	create(token: {
		userId: string;
		tokenId: string;
		refreshToken: string;
		isRevoked: boolean;
		expiresAt: Date;
		userAgent?: string;
		ipAddress?: string;
	}): Promise<RefreshToken>;
	findByTokenId(tokenId: string): Promise<RefreshToken | null>;
	findByUserId(userId: string): Promise<RefreshToken[]>;
	revoke(tokenId: string): Promise<boolean>;
	revokeAllForUser(userId: string): Promise<boolean>;
	cleanupExpired(): Promise<number>;
}
