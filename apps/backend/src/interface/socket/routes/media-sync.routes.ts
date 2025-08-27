import { Socket } from 'socket.io';
import { MediaSyncController } from '../controllers/media-sync.controller';
import { emitValidationError } from '../middlewares/error-handler.middleware';
import {
	AddToQueueInput,
	addToQueueSchema,
	ClearQueueInput,
	clearQueueSchema,
	JoinRoomInput,
	joinRoomSchema,
	LeaveRoomInput,
	leaveRoomSchema,
	MediaPauseInput,
	mediaPauseSchema,
	MediaPlayInput,
	mediaPlaySchema,
	MediaSeekInput,
	mediaSeekSchema,
	RemoveFromQueueInput,
	removeFromQueueSchema,
	ReorderQueueInput,
	reorderQueueSchema,
} from '../validators/media-sync.validation';

export const createMediaSyncRoutes = (mediaSyncController: MediaSyncController) => {
	return (socket: Socket) => {
		// Media sync events
		socket.on('join-room', async (data: JoinRoomInput) => {
			const validation = joinRoomSchema.safeParse(data);
			if (!validation.success) {
				emitValidationError(socket, 'join-room', validation.error.issues);
				return;
			}
			await mediaSyncController.handleJoinRoom(socket, validation.data.roomCode);
		});

		socket.on('leave-room', (data: LeaveRoomInput) => {
			const validation = leaveRoomSchema.safeParse(data);
			if (!validation.success) {
				emitValidationError(socket, 'leave-room', validation.error.issues);
				return;
			}
			mediaSyncController.handleLeaveRoom(socket, validation.data.roomCode);
		});

		socket.on('media-play', (data: MediaPlayInput) => {
			const validation = mediaPlaySchema.safeParse(data);
			if (!validation.success) {
				emitValidationError(socket, 'media-play', validation.error.issues);
				return;
			}
			mediaSyncController.handleMediaPlay(socket, validation.data);
		});

		socket.on('media-pause', (data: MediaPauseInput) => {
			const validation = mediaPauseSchema.safeParse(data);
			if (!validation.success) {
				emitValidationError(socket, 'media-pause', validation.error.issues);
				return;
			}
			mediaSyncController.handleMediaPause(socket, validation.data);
		});

		socket.on('media-seek', (data: MediaSeekInput) => {
			const validation = mediaSeekSchema.safeParse(data);
			if (!validation.success) {
				emitValidationError(socket, 'media-seek', validation.error.issues);
				return;
			}
			mediaSyncController.handleMediaSeek(socket, validation.data);
		});

		// Media queue events
		socket.on('add-to-queue', (data: AddToQueueInput) => {
			console.log('add-to-queue event received:', data);
			const validation = addToQueueSchema.safeParse(data);
			if (!validation.success) {
				emitValidationError(socket, 'add-to-queue', validation.error.issues);
				return;
			}
			mediaSyncController.handleAddToQueue(socket, validation.data);
		});

		socket.on('remove-from-queue', (data: RemoveFromQueueInput) => {
			const validation = removeFromQueueSchema.safeParse(data);
			if (!validation.success) {
				emitValidationError(socket, 'remove-from-queue', validation.error.issues);
				return;
			}
			mediaSyncController.handleRemoveFromQueue(socket, validation.data);
		});

		socket.on('reorder-queue', (data: ReorderQueueInput) => {
			const validation = reorderQueueSchema.safeParse(data);
			if (!validation.success) {
				emitValidationError(socket, 'reorder-queue', validation.error.issues);
				return;
			}
			mediaSyncController.handleReorderQueue(socket, validation.data);
		});

		socket.on('clear-queue', (data: ClearQueueInput) => {
			const validation = clearQueueSchema.safeParse(data);
			if (!validation.success) {
				emitValidationError(socket, 'clear-queue', validation.error.issues);
				return;
			}
			mediaSyncController.handleClearQueue(socket, validation.data);
		});
	};
};
