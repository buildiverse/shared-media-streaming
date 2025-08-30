import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

export interface ISocketService {
	initialize(httpServer: HTTPServer): void;
	getIO(): SocketIOServer;
	joinRoom(socketId: string, roomId: string): void;
	leaveRoom(socketId: string, roomId: string): void;
	broadcastToRoom(roomId: string, event: string, data: any): void;
	broadcastToUser(userId: string, event: string, data: any): void;
	getConnectedUsers(): string[];
}
