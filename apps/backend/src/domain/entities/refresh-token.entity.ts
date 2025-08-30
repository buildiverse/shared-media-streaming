export class RefreshToken {
	constructor(
		public readonly id: string,
		public readonly userId: string,
		public readonly tokenId: string,
		public readonly refreshToken: string,
		public readonly isRevoked: boolean = false,
		public readonly expiresAt: Date,
		public readonly userAgent?: string,
		public readonly ipAddress?: string,
		public readonly createdAt: Date = new Date(),
	) {}

	// Business logic methods
	isExpired(): boolean {
		return new Date() > this.expiresAt;
	}

	isValid(): boolean {
		return !this.isRevoked && !this.isExpired();
	}

	revoke(): RefreshToken {
		return new RefreshToken(
			this.id,
			this.userId,
			this.tokenId,
			this.refreshToken,
			true,
			this.expiresAt,
			this.userAgent,
			this.ipAddress,
			this.createdAt,
		);
	}

	// Validation methods
	static validateTokenId(tokenId: string): boolean {
		return tokenId.length > 0;
	}

	static validateRefreshToken(token: string): boolean {
		return token.length > 0;
	}
}
