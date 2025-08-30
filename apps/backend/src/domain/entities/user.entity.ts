export class User {
	constructor(
		public readonly id: string,
		public readonly username: string,
		public readonly email: string,
		public readonly password: string,
		public readonly avatarUrl?: string,
		public readonly createdAt: Date = new Date(),
		public readonly lastActiveAt: Date = new Date(),
		public readonly updatedAt: Date = new Date(),
	) {}

	// Business logic methods
	updateLastActive(): User {
		return new User(
			this.id,
			this.username,
			this.email,
			this.password,
			this.avatarUrl,
			this.createdAt,
			new Date(),
			new Date(),
		);
	}

	updateProfile(updates: Partial<Pick<User, 'username' | 'email' | 'avatarUrl'>>): User {
		return new User(
			this.id,
			updates.username || this.username,
			updates.email || this.email,
			this.password,
			updates.avatarUrl || this.avatarUrl,
			this.createdAt,
			this.lastActiveAt,
			new Date(),
		);
	}

	// Validation methods
	static validateUsername(username: string): boolean {
		return username.length >= 3 && username.length <= 30 && /^[a-zA-Z0-9_-]+$/.test(username);
	}

	static validateEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}
}
