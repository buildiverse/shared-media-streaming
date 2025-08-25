import { AuthService } from '../../../src/infrastructure/services/auth.service';

// Mock environment variables
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

describe('AuthService', () => {
	const makeSut = () => {
		const sut = new AuthService();
		return { sut };
	};

	it('generates access token', () => {
		const { sut } = makeSut();
		const userId = 'user123';
		const username = 'testuser';

		const token = sut.generateAccessToken(userId, username);

		expect(token).toBeDefined();
		expect(typeof token).toBe('string');
		expect(token.split('.')).toHaveLength(3); // JWT format
	});

	it('generates refresh token', () => {
		const { sut } = makeSut();
		const userId = 'user123';
		const tokenId = 'token123';

		const token = sut.generateRefreshToken(userId, tokenId);

		expect(token).toBeDefined();
		expect(typeof token).toBe('string');
		expect(token.split('.')).toHaveLength(3); // JWT format
	});

	it('verifies valid access token', () => {
		const { sut } = makeSut();
		const userId = 'user123';
		const username = 'testuser';
		const token = sut.generateAccessToken(userId, username);

		const decoded = sut.verifyAccessToken(token);

		expect(decoded).toBeDefined();
		expect(decoded?.userId).toBe(userId);
	});

	it('returns null on invalid token', () => {
		const { sut } = makeSut();

		const result = sut.verifyAccessToken('invalid.token.here');
		expect(result).toBeNull();
	});
});
