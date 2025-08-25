import { UserRepository } from '../../../../../src/infrastructure/db/mongoose/repositories/user.repository';

// Mock Mongoose models
jest.mock('../../../../../src/infrastructure/db/mongoose/models/user.model', () => ({
	UserModel: {
		findOne: jest.fn(),
		findById: jest.fn(),
		findByIdAndUpdate: jest.fn(),
		findByIdAndDelete: jest.fn(),
		create: jest.fn(),
		updateOne: jest.fn(),
		aggregate: jest.fn(),
	},
}));

describe('UserRepository', () => {
	const makeSut = () => {
		const sut = new UserRepository();
		return { sut };
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('finds user by username', async () => {
		const { sut } = makeSut();
		const mockUser = { _id: 'user123', username: 'testuser', email: 'test@example.com' };
		const { UserModel } = require('../../../../../src/infrastructure/db/mongoose/models/user.model');
		UserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) });

		const result = await sut.findByUsername('testuser');

		expect(result).toBeDefined();
		expect(result?.id).toBe('user123');
		expect(UserModel.findOne).toHaveBeenCalledWith({ username: 'testuser' });
	});

	it('finds user by email', async () => {
		const { sut } = makeSut();
		const mockUser = { _id: 'user123', username: 'testuser', email: 'test@example.com' };
		const { UserModel } = require('../../../../../src/infrastructure/db/mongoose/models/user.model');
		UserModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) });

		const result = await sut.findByEmail('test@example.com');

		expect(result).toBeDefined();
		expect(result?.id).toBe('user123');
		expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
	});

	it('creates new user', async () => {
		const { sut } = makeSut();
		const userData = { username: 'newuser', email: 'new@example.com', password: 'hash' };
		const mockUser = { _id: 'user123', ...userData };
		const { UserModel } = require('../../../../../src/infrastructure/db/mongoose/models/user.model');
		UserModel.create.mockResolvedValue(mockUser);

		const result = await sut.create(userData);

		expect(result).toBeDefined();
		expect(result.id).toBe('user123');
		expect(UserModel.create).toHaveBeenCalledWith(userData);
	});

	it('updates user last active', async () => {
		const { sut } = makeSut();
		const userId = 'user123';
		const mockUser = { _id: userId, username: 'testuser' };
		const { UserModel } = require('../../../../../src/infrastructure/db/mongoose/models/user.model');
		UserModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockReturnValue(mockUser) });

		await sut.updateLastActive(userId);

		expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
			userId,
			{ lastActiveAt: expect.any(Date) },
			{ new: true }
		);
	});
});
