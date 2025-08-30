import { ILoggingService } from '../../domain/services/ilogging.service';

export interface ChatMessageInput {
	roomId: string;
	message: string;
	userId: string;
	mediaId?: string;
	replyTo?: string;
}

export interface ChatMessageResult {
	messageId: string;
	timestamp: Date;
	success: boolean;
}

export class SendChatMessageUseCase {
	constructor(private loggingService: ILoggingService) {}

	async execute(input: ChatMessageInput): Promise<ChatMessageResult> {
		const { roomId, message, userId, mediaId, replyTo } = input;

		// TODO: Add message validation logic here
		// - Check if user is in the room
		// - Check message rate limits
		// - Validate mediaId if provided
		// - Validate replyTo if provided
		// - Store message in database

		this.loggingService.info('Chat message sent', {
			userId,
			roomId,
			messageLength: message.length,
			mediaId,
			replyTo,
		});

		// For now, return basic success
		// In a real implementation, you'd store the message and return its ID
		return {
			messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			timestamp: new Date(),
			success: true,
		};
	}
}
