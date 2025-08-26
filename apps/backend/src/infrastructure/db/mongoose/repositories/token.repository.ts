import { RefreshToken } from '../../../../domain/entities/refresh-token.entity';
import { ITokenRepository } from '../../../../domain/repositories/itoken.repository';
import { TokenModel } from '../models/token.model';

export class TokenRepository implements ITokenRepository {
	async create(tokenData: Omit<RefreshToken, 'id' | 'createdAt'>): Promise<RefreshToken> {
		const token = await TokenModel.create({
			userId: tokenData.userId,
			tokenId: tokenData.tokenId,
			refreshToken: tokenData.refreshToken,
			isRevoked: tokenData.isRevoked,
			expiresAt: tokenData.expiresAt,
			userAgent: tokenData.userAgent,
			ipAddress: tokenData.ipAddress,
		});

		return new RefreshToken(
			(token._id as any).toString(),
			token.userId,
			token.tokenId,
			token.refreshToken,
			token.isRevoked,
			token.expiresAt,
			token.userAgent,
			token.ipAddress,
			token.createdAt,
		);
	}

	async findByTokenId(tokenId: string): Promise<RefreshToken | null> {
		const token = await TokenModel.findOne({ tokenId }).exec();
		if (!token) return null;

		return new RefreshToken(
			(token._id as any).toString(),
			token.userId,
			token.tokenId,
			token.refreshToken,
			token.isRevoked,
			token.expiresAt,
			token.userAgent,
			token.ipAddress,
			token.createdAt,
		);
	}

	async findByUserId(userId: string): Promise<RefreshToken[]> {
		const tokens = await TokenModel.find({ userId }).exec();
		return tokens.map(
			(token) =>
				new RefreshToken(
					(token._id as any).toString(),
					token.userId,
					token.tokenId,
					token.refreshToken,
					token.isRevoked,
					token.expiresAt,
					token.userAgent,
					token.ipAddress,
					token.createdAt,
				),
		);
	}

	async revoke(tokenId: string): Promise<boolean> {
		const result = await TokenModel.findOneAndUpdate(
			{ tokenId },
			{ isRevoked: true },
			{ new: true },
		).exec();
		return !!result;
	}

	async revokeAllForUser(userId: string): Promise<number> {
		const result = await TokenModel.updateMany({ userId }, { isRevoked: true }).exec();
		return result.modifiedCount || 0; // Return actual count of tokens revoked
	}

	async cleanupExpired(): Promise<number> {
		const result = await TokenModel.deleteMany({
			expiresAt: { $lt: new Date() },
		}).exec();
		return result.deletedCount || 0;
	}
}
