import { v4 as uuidv4 } from 'uuid';
import { User } from '../../domain/entities/user.entity';
import { ITokenRepository } from '../../domain/repositories/itoken.repository';
import { IUserRepository } from '../../domain/repositories/iuser.repository';
import { IAuthService } from '../../domain/services/iauth.service';
import { IPasswordService } from '../../domain/services/password.service';

export interface LoginInput {
	username: string;
	password: string;
	userAgent?: string;
	ipAddress?: string;
}

export interface LoginResult {
	user: User;
	accessToken: string;
	refreshToken: string;
}

export class LoginUseCase {
	constructor(
		private userRepository: IUserRepository,
		private tokenRepository: ITokenRepository,
		private passwordService: IPasswordService,
		private authService: IAuthService,
	) {}

	async execute(input: LoginInput): Promise<LoginResult> {
		// Find user by username
		const user = await this.userRepository.findByUsername(input.username);
		if (!user) {
			throw new Error('Invalid credentials');
		}

		// Verify password
		const isPasswordValid = await this.passwordService.comparePassword(
			input.password,
			user.password,
		);
		if (!isPasswordValid) {
			throw new Error('Invalid credentials');
		}

		// Generate tokens
		const tokenId = uuidv4();
		const accessToken = this.authService.generateAccessToken(user.id, user.username);
		const refreshToken = this.authService.generateRefreshToken(user.id, tokenId);

		// Store refresh token
		await this.tokenRepository.create({
			userId: user.id,
			tokenId,
			refreshToken,
			isRevoked: false,
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
			userAgent: input.userAgent,
			ipAddress: input.ipAddress,
		});

		// Update last active
		await this.userRepository.updateLastActive(user.id);

		return {
			user,
			accessToken,
			refreshToken,
		};
	}
}
