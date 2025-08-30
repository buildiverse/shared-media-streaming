import bcrypt from 'bcryptjs';
import { IPasswordService } from '../../domain/services/password.service';

export class BcryptPasswordService implements IPasswordService {
	/**
	 * Hash a password using bcrypt
	 */
	async hashPassword(password: string): Promise<string> {
		return await bcrypt.hash(password, 12);
	}

	/**
	 * Compare a password with a hash
	 */
	async comparePassword(password: string, hash: string): Promise<boolean> {
		return await bcrypt.compare(password, hash);
	}

	/**
	 * Validate password strength
	 */
	validatePassword(password: string): boolean {
		return password.length >= 8 && /^(?=.*[A-Za-z])(?=.*\d)/.test(password);
	}
}
