import { User } from '../entities/user.entity';

export interface IUserRepository {
	findById(id: string): Promise<User | null>;
	findByUsername(username: string): Promise<User | null>;
	findByEmail(email: string): Promise<User | null>;
	create(user: {
		username: string;
		email: string;
		password: string;
		avatarUrl?: string;
	}): Promise<User>;
	update(
		id: string,
		updates: Partial<
			Pick<User, 'username' | 'email' | 'avatarUrl' | 'password' | 'maxUploadLimit'>
		>,
	): Promise<User | null>;
	delete(id: string): Promise<boolean>;
	checkUsernameExists(username: string): Promise<boolean>;
	checkEmailExists(email: string): Promise<boolean>;
	updateLastActive(id: string): Promise<User | null>;
	getUserStats(userId: string): Promise<any>;
}
