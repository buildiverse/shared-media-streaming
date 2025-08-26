import cors from 'cors';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import { CreateRoomUseCase } from './application/use-cases/create-room.usecase';
import { CreateUserUseCase } from './application/use-cases/create-user.usecase';
import { DeleteMediaUseCase } from './application/use-cases/delete-media.usecase';
import { GetMediaByIdUseCase } from './application/use-cases/get-media-by-id.usecase';
import { GetPublicRoomsUseCase } from './application/use-cases/get-public-rooms.usecase';
import { GetUserMediaUseCase } from './application/use-cases/get-user-media.usecase';
import { LoginUseCase } from './application/use-cases/login.usecase';
import { UploadMediaUseCase } from './application/use-cases/upload-media.usecase';
import { HTTP_STATUS } from './infrastructure/constants/http-status';
import { BcryptPasswordService } from './infrastructure/crypto/bcrypt-password.service';
import { MediaRepository } from './infrastructure/db/mongoose/repositories/media.repository';
import { RoomRepository } from './infrastructure/db/mongoose/repositories/room.repository';
import { TokenRepository } from './infrastructure/db/mongoose/repositories/token.repository';
import { UserRepository } from './infrastructure/db/mongoose/repositories/user.repository';
import { AuthService } from './infrastructure/services/auth.service';
import { LoggingService } from './infrastructure/services/logging.service';
import { RoomStateService } from './infrastructure/services/room-state.service';
import { S3UploadService } from './infrastructure/services/s3-upload.service';
import { SocketService } from './infrastructure/services/socket.service';

import { AuthController } from './interface/http/controllers/auth.controller';
import { MediaController } from './interface/http/controllers/media.controller';
import { RoomController } from './interface/http/controllers/room.controller';
import { UserController } from './interface/http/controllers/user.controller';
import { globalErrorHandler, requestIdMiddleware } from './interface/http/middlewares';
import { helmetConfig, rateLimiterConfig } from './interface/http/middlewares/configurations';
import { createAuthRoutes } from './interface/http/routes/auth.routes';
import { createMediaRoutes } from './interface/http/routes/media.routes';
import { createRoomRoutes } from './interface/http/routes/room.routes';
import { createUserRoutes } from './interface/http/routes/user.routes';

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(helmetConfig);
app.use(rateLimiterConfig);

// --- Clean Architecture Dependency Injection ---

// 1. Initialize services
const loggingService = new LoggingService();
const passwordService = new BcryptPasswordService();
const authService = new AuthService();
const roomStateService = new RoomStateService();
const s3UploadService = new S3UploadService();

// 2. Initialize repositories
const userRepository = new UserRepository();
const tokenRepository = new TokenRepository();
const mediaRepository = new MediaRepository();
const roomRepository = new RoomRepository();

// 3. Initialize use cases
const createUserUseCase = new CreateUserUseCase(userRepository, passwordService);
const loginUseCase = new LoginUseCase(
	userRepository,
	tokenRepository,
	passwordService,
	authService,
);
const createRoomUseCase = new CreateRoomUseCase(roomRepository, loggingService);
const getPublicRoomsUseCase = new GetPublicRoomsUseCase(roomRepository, loggingService);
const uploadMediaUseCase = new UploadMediaUseCase(mediaRepository, s3UploadService, loggingService);
const getUserMediaUseCase = new GetUserMediaUseCase(mediaRepository, loggingService);
const getMediaByIdUseCase = new GetMediaByIdUseCase(mediaRepository, loggingService);
const deleteMediaUseCase = new DeleteMediaUseCase(mediaRepository, s3UploadService, loggingService);

// 4. Initialize controllers with use cases
const userController = new UserController(createUserUseCase, userRepository, loggingService);
const authController = new AuthController(loginUseCase, loggingService);
const roomController = new RoomController(createRoomUseCase, getPublicRoomsUseCase, loggingService);
const mediaController = new MediaController(
	uploadMediaUseCase,
	getUserMediaUseCase,
	getMediaByIdUseCase,
	deleteMediaUseCase,
	loggingService,
);

// Initialize socket service for real-time communication
const socketService = new SocketService(loggingService, authService, roomStateService);

// Export for use in index.ts
export { socketService };

// 5. Request ID middleware for tracing
app.use(requestIdMiddleware(loggingService));

// 6. Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Mount routes
app.use('/api/v1/users', createUserRoutes(userController, authService));
app.use('/api/v1/auth', createAuthRoutes(authController));
app.use('/api/v1/rooms', createRoomRoutes(roomController, authService, loggingService));
app.use('/api/v1/media', createMediaRoutes(mediaController, authService));

// 404 handler for undefined routes
// Routes should be hidden in production
app.use('*', (_req, res) => {
	res.status(HTTP_STATUS.NOT_FOUND).json({
		success: false,
		message: 'API endpoint not found',
		availableEndpoints: [
			'GET /health',
			'GET /status',
			'GET /mongo (development only)',
			'GET /api/v1/users/check-username/:username',
			'GET /api/v1/users/check-email/:email',
			'POST /api/v1/users/signup',
			'POST /api/v1/auth/login',
			'POST /api/v1/auth/refresh-token',
			'POST /api/v1/auth/logout',
			'GET /api/v1/rooms/public',
			'POST /api/v1/rooms/create',
			'GET /api/v1/rooms/:roomCode',
			'POST /api/v1/media/upload',
			'GET /api/v1/media/my-media',
			'GET /api/v1/media/:id',
			'DELETE /api/v1/media/:id',
		],
	});
});

// Global error handler
app.use(globalErrorHandler);

export default app;
