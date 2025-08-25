import { Socket } from 'socket.io';
import { ChatController } from '../controllers/chat.controller';
import { emitValidationError } from '../middlewares/error-handler.middleware';
import {
	ChatMessageInput,
	chatMessageSchema,
	TypingStartInput,
	typingStartSchema,
	TypingStopInput,
	typingStopSchema,
} from '../validators/chat.validation';

export const createChatRoutes = (chatController: ChatController) => {
	return (socket: Socket) => {
		// Chat events
		socket.on('chat-message', async (data: ChatMessageInput) => {
			const validation = chatMessageSchema.safeParse(data);
			if (!validation.success) {
				emitValidationError(socket, 'chat-message', validation.error.issues);
				return;
			}

			// Add userId from authenticated socket
			const messageData = {
				...validation.data,
				userId: (socket as any).user?.userId || 'unknown',
			};

			await chatController.handleChatMessage(socket, messageData);
		});

		socket.on('typing-start', (data: TypingStartInput) => {
			const validation = typingStartSchema.safeParse(data);
			if (!validation.success) {
				emitValidationError(socket, 'typing-start', validation.error.issues);
				return;
			}

			// Add userId from authenticated socket
			const typingData = {
				...validation.data,
				userId: (socket as any).user?.userId || 'unknown',
			};

			chatController.handleTypingStart(socket, typingData);
		});

		socket.on('typing-stop', (data: TypingStopInput) => {
			const validation = typingStopSchema.safeParse(data);
			if (!validation.success) {
				emitValidationError(socket, 'typing-stop', validation.error.issues);
				return;
			}

			// Add userId from authenticated socket
			const typingData = {
				...validation.data,
				userId: (socket as any).user?.userId || 'unknown',
			};

			chatController.handleTypingStop(socket, typingData);
		});
	};
};
