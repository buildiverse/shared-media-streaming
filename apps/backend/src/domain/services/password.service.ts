export interface IPasswordService {
	hashPassword(password: string): Promise<string>;
	comparePassword(password: string, hash: string): Promise<boolean>;
	validatePassword(password: string): boolean;
}

// This is just a placeholder - the real implementation is in infrastructure
export class PasswordService implements IPasswordService {
	async hashPassword(_password: string): Promise<string> {
		throw new Error('PasswordService.hashPassword not implemented - use BcryptPasswordService');
	}

	async comparePassword(_password: string, _hash: string): Promise<boolean> {
		throw new Error('PasswordService.comparePassword not implemented - use BcryptPasswordService');
	}

	validatePassword(password: string): boolean {
		return password.length >= 8 && /^(?=.*[A-Za-z])(?=.*\d)/.test(password);
	}
}
