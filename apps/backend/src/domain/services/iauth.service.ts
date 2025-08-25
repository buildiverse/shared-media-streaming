export interface IAuthService {
	verifyAccessToken(token: string): { userId: string; username: string } | null;
	verifyRefreshToken(token: string): { userId: string; tokenId: string } | null;
	generateAccessToken(userId: string, username: string): string;
	generateRefreshToken(userId: string, tokenId: string): string;
}
