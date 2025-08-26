import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { JoinRoomUseCase } from '../../application/use-cases/join-room.usecase';
import { SendChatMessageUseCase } from '../../application/use-cases/send-chat-message.usecase';
import { IAuthService } from '../../domain/services/iauth.service';
import { ILoggingService } from '../../domain/services/ilogging.service';
import { IRoomStateService } from '../../domain/services/iroom-state.service';
import { ISocketService } from '../../domain/services/isocket.service';
import { ChatController } from '../../interface/socket/controllers/chat.controller';
import { MediaSyncController } from '../../interface/socket/controllers/media-sync.controller';
import { SocketRoomController } from '../../interface/socket/controllers/room.controller';
import {
	AuthenticatedSocket,
	socketAuthMiddleware,
} from '../../interface/socket/middlewares/auth.middleware';
import { createSocketRateLimitConfig } from '../../interface/socket/middlewares/configurations/socket-rate-limit.config';
import { createSocketErrorHandler } from '../../interface/socket/middlewares/error-handler.middleware';
import { createChatRoutes } from '../../interface/socket/routes/chat.routes';
import { createMediaSyncRoutes } from '../../interface/socket/routes/media-sync.routes';
import { createSocketRoomRoutes } from '../../interface/socket/routes/room.routes';

export class SocketService implements ISocketService {
	private io: SocketIOServer | null = null;
	private loggingService: ILoggingService;
	private mediaSyncController: MediaSyncController;
	private chatController: ChatController;
	private authService: IAuthService;
	private socketRoomController: SocketRoomController;

	constructor(
		loggingService: ILoggingService,
		authService: IAuthService,
		roomStateService: IRoomStateService,
	) {
		this.loggingService = loggingService;
		this.authService = authService;

		// Initialize use cases
		const sendChatMessageUseCase = new SendChatMessageUseCase(loggingService);

		// Initialize controllers with use cases
		this.mediaSyncController = new MediaSyncController(loggingService);
		this.chatController = new ChatController(loggingService, sendChatMessageUseCase);

		// Initialize room use case
		const joinRoomUseCase = new JoinRoomUseCase(loggingService);

		this.socketRoomController = new SocketRoomController(
			joinRoomUseCase,
			roomStateService,
			loggingService,
		);
	}

	initialize(httpServer: HTTPServer): void {
		this.io = new SocketIOServer(httpServer, {
			cors: {
				origin: process.env.FRONTEND_URL || 'http://localhost:5173',
				methods: ['GET', 'POST'],
			},
		});

		this.setupEventHandlers();
		this.loggingService.info('Socket.IO service initialized');
	}

	private setupEventHandlers(): void {
		if (!this.io) return;

		// Apply rate limiting middleware
		const rateLimitMiddleware = createSocketRateLimitConfig(this.loggingService, {
			points: 100, // 100 events per minute
			duration: 60,
			maxConnectionsPerIP: 20, // Increased from 5 to 20
			connectionWindowMs: 30000, // Reduced from 60s to 30s
		});
		this.io.use(rateLimitMiddleware);

		// Apply authentication middleware
		this.io.use(socketAuthMiddleware(this.authService));

		// Create error handler
		const errorHandler = createSocketErrorHandler(this.loggingService);

		this.io.on('connection', (socket: AuthenticatedSocket) => {
			this.loggingService.info('Client connected', {
				socketId: socket.id,
				userId: socket.user?.userId,
				requestId: (socket.request as any).requestId,
			});

			// Set up routes
			const mediaSyncRoutes = createMediaSyncRoutes(this.mediaSyncController);
			const chatRoutes = createChatRoutes(this.chatController);
			const roomRoutes = createSocketRoomRoutes(this.socketRoomController);

			// Apply routes to socket
			mediaSyncRoutes(socket);
			chatRoutes(socket);
			roomRoutes(socket);

			// Set up error handling for this socket
			socket.on('error', (error: Error) => {
				errorHandler(socket, error);
			});

			socket.on('disconnect', () => {
				this.loggingService.info('Client disconnected', {
					socketId: socket.id,
					userId: socket.user?.userId,
					requestId: (socket.request as any).requestId,
				});
			});
		});
	}

	getIO(): SocketIOServer {
		if (!this.io) {
			throw new Error('Socket.IO service not initialized');
		}
		return this.io;
	}

	joinRoom(socketId: string, roomId: string): void {
		if (!this.io) return;

		const socket = this.io.sockets.sockets.get(socketId);
		if (socket) {
			socket.join(roomId);
		}
	}

	leaveRoom(socketId: string, roomId: string): void {
		if (!this.io) return;

		const socket = this.io.sockets.sockets.get(socketId);
		if (socket) {
			socket.leave(roomId);
		}
	}

	broadcastToRoom(roomId: string, event: string, data: any): void {
		if (!this.io) return;

		this.io.to(roomId).emit(event, data);
	}

	broadcastToUser(_userId: string, event: string, data: any): void {
		if (!this.io) return;

		// This would need to be implemented with user-socket mapping
		// For now, we'll broadcast to all connected clients
		this.io.emit(event, data);
	}

	getConnectedUsers(): string[] {
		if (!this.io) return [];

		return Array.from(this.io.sockets.sockets.keys());
	}
}
