import { ITokenRepository } from '../../domain/repositories/itoken.repository';
import { IUserRepository } from '../../domain/repositories/iuser.repository';

export interface LogoutInput {
	userId: string;
	userAgent?: string;
	ipAddress?: string;
	allDevices?: boolean; // Option to logout from all devices
}

export interface LogoutResult {
	success: boolean;
	message: string;
	tokensRevoked: number;
}

export class LogoutUseCase {
	constructor(
		private tokenRepository: ITokenRepository,
		private userRepository: IUserRepository,
	) {}

	async execute(input: LogoutInput): Promise<LogoutResult> {
		let tokensRevoked = 0;

		if (input.allDevices) {
			// Revoke all refresh tokens for the user
			tokensRevoked = await this.tokenRepository.revokeAllForUser(input.userId);
		} else {
			// For now, we'll revoke all tokens since we don't have device-specific tracking
			// In a more sophisticated system, you'd track individual device sessions
			tokensRevoked = await this.tokenRepository.revokeAllForUser(input.userId);
		}

		// Update user's last active time
		await this.userRepository.updateLastActive(input.userId);

		return {
			success: true,
			message: `Successfully logged out. ${tokensRevoked} session(s) terminated.`,
			tokensRevoked,
		};
	}
}
