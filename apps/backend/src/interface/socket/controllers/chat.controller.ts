import { Socket } from 'socket.io';
import { SendChatMessageUseCase } from '../../../application/use-cases/send-chat-message.usecase';
import { ILoggingService } from '../../../domain/services/ilogging.service';

export class ChatController {
	constructor(
		private loggingService: ILoggingService,
		private sendChatMessageUseCase: SendChatMessageUseCase,
	) {}

	async handleChatMessage(
		socket: Socket,
		data: { roomId: string; message: string; userId: string },
	): Promise<void> {
		try {
			// Execute use case
			const result = await this.sendChatMessageUseCase.execute({
				roomId: data.roomId,
				message: data.message,
				userId: data.userId,
			});

			if (result.success) {
				const messageData = {
					...data,
					messageId: result.messageId,
					socketId: socket.id,
					timestamp: result.timestamp,
				};

				// Broadcast to room (excluding sender)
				socket.to(data.roomId).emit('chat-message', messageData);

				// Also emit back to sender for confirmation
				socket.emit('chat-message-sent', messageData);

				this.loggingService.info('Chat message broadcasted', {
					socketId: socket.id,
					roomId: data.roomId,
					userId: data.userId,
					messageLength: data.message.length,
					messageId: result.messageId,
					requestId: (socket.request as any).requestId,
				});
			}
		} catch (error) {
			this.loggingService.error('Failed to send chat message', error, {
				socketId: socket.id,
				roomId: data.roomId,
				userId: data.userId,
				requestId: (socket.request as any).requestId,
			});
			// Emit error to client
			socket.emit('error', {
				code: 'CHAT_MESSAGE_ERROR',
				message: 'Failed to send message',
				event: 'chat-message',
			});
		}
	}

	handleTypingStart(socket: Socket, data: { roomId: string; userId: string }): void {
		socket.to(data.roomId).emit('user-typing-start', {
			...data,
			socketId: socket.id,
		});
	}

	handleTypingStop(socket: Socket, data: { roomId: string; userId: string }): void {
		socket.to(data.roomId).emit('user-typing-stop', {
			...data,
			socketId: socket.id,
		});
	}
}
