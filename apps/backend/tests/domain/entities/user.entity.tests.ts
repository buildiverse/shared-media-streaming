import { User } from '../../../src/domain/entities/user.entity';

describe('User Entity', () => {
	it('creates user with valid data', () => {
		const user = new User(
			'user123',
			'testuser',
			'test@example.com',
			'hashedpassword'
		);

		expect(user.username).toBe('testuser');
		expect(user.email).toBe('test@example.com');
		expect(user.password).toBe('hashedpassword');
		expect(user.id).toBeDefined();
		expect(user.createdAt).toBeInstanceOf(Date);
	});

	it('has validation methods', () => {
		expect(User.validateUsername('validuser')).toBe(true);
		expect(User.validateUsername('ab')).toBe(false);
		expect(User.validateEmail('test@example.com')).toBe(true);
		expect(User.validateEmail('invalid-email')).toBe(false);
	});
});
