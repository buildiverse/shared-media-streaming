import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/repositories/iuser.repository';
import { IPasswordService } from '../../domain/services/password.service';

export interface CreateUserInput {
	username: string;
	email: string;
	password: string;
	avatarUrl?: string;
}

export class CreateUserUseCase {
	constructor(
		private userRepository: IUserRepository,
		private passwordService: IPasswordService,
	) {}

	async execute(input: CreateUserInput): Promise<User> {
		// Validate input
		if (!User.validateUsername(input.username)) {
			throw new Error('Invalid username format');
		}

		if (!User.validateEmail(input.email)) {
			throw new Error('Invalid email format');
		}

		if (!this.passwordService.validatePassword(input.password)) {
			throw new Error('Invalid password format');
		}

		// Check if username already exists
		const usernameExists = await this.userRepository.checkUsernameExists(input.username);
		if (usernameExists) {
			throw new Error('Username already exists');
		}

		// Check if email already exists
		const emailExists = await this.userRepository.checkEmailExists(input.email);
		if (emailExists) {
			throw new Error('Email already exists');
		}

		// Hash password
		const hashedPassword = await this.passwordService.hashPassword(input.password);

		// Create user
		const user = await this.userRepository.create({
			username: input.username,
			email: input.email,
			password: hashedPassword,
			avatarUrl: input.avatarUrl,
		});

		return user;
	}
}
