import { User } from '../../../../domain/entities/user.entity';
import { IUserRepository } from '../../../../domain/repositories/iuser.repository';
import { UserModel } from '../models/user.model';

export class UserRepository implements IUserRepository {
	async findById(id: string): Promise<User | null> {
		const user = await UserModel.findById(id).exec();
		if (!user) return null;

		return new User(
			(user._id as any).toString(),
			user.username,
			user.email,
			user.password,
			user.avatarUrl,
			user.createdAt,
			user.lastActiveAt,
			user.updatedAt,
		);
	}

	async findByUsername(username: string): Promise<User | null> {
		const user = await UserModel.findOne({ username }).exec();
		if (!user) return null;

		return new User(
			(user._id as any).toString(),
			user.username,
			user.email,
			user.password,
			user.avatarUrl,
			user.createdAt,
			user.lastActiveAt,
			user.updatedAt,
		);
	}

	async findByEmail(email: string): Promise<User | null> {
		const user = await UserModel.findOne({ email }).exec();
		if (!user) return null;

		return new User(
			(user._id as any).toString(),
			user.username,
			user.email,
			user.password,
			user.avatarUrl,
			user.createdAt,
			user.lastActiveAt,
			user.updatedAt,
		);
	}

	async create(userData: {
		username: string;
		email: string;
		password: string;
		avatarUrl?: string;
	}): Promise<User> {
		const user = await UserModel.create({
			username: userData.username,
			email: userData.email,
			password: userData.password,
			avatarUrl: userData.avatarUrl,
		});

		return new User(
			(user._id as any).toString(),
			user.username,
			user.email,
			user.password,
			user.avatarUrl,
			user.createdAt,
			user.lastActiveAt,
			user.updatedAt,
		);
	}

	async update(
		id: string,
		updates: Partial<Pick<User, 'username' | 'email' | 'avatarUrl' | 'password'>>,
	): Promise<User | null> {
		const user = await UserModel.findByIdAndUpdate(
			id,
			{ ...updates, updatedAt: new Date() },
			{ new: true },
		).exec();

		if (!user) return null;

		return new User(
			(user._id as any).toString(),
			user.username,
			user.email,
			user.password,
			user.avatarUrl,
			user.createdAt,
			user.lastActiveAt,
			user.updatedAt,
		);
	}

	async delete(id: string): Promise<boolean> {
		const result = await UserModel.findByIdAndDelete(id).exec();
		return !!result;
	}

	async checkUsernameExists(username: string): Promise<boolean> {
		const user = await UserModel.findOne({ username }).exec();
		return !!user;
	}

	async checkEmailExists(email: string): Promise<boolean> {
		const user = await UserModel.findOne({ email }).exec();
		return !!user;
	}

	async updateLastActive(id: string): Promise<User | null> {
		const user = await UserModel.findByIdAndUpdate(
			id,
			{ lastActiveAt: new Date() },
			{ new: true },
		).exec();

		if (!user) return null;

		return new User(
			(user._id as any).toString(),
			user.username,
			user.email,
			user.password,
			user.avatarUrl,
			user.createdAt,
			user.lastActiveAt,
			user.updatedAt,
		);
	}

	async getUserStats(userId: string): Promise<any> {
		// Implementation for user statistics
		return { userId, stats: 'placeholder' };
	}
}
