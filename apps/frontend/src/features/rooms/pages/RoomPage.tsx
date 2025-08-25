import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Media, Room, RoomMessage, RoomUser, User } from '../../../types';
import { Button } from '../../../ui/atoms/Button';
import { MediaGrid } from '../../../ui/organisms/MediaGrid';
import { DashboardLayout } from '../../../ui/templates/DashboardLayout';

interface RoomPageProps {
	user: User;
	onLogout: () => void;
}

export const RoomPage: React.FC<RoomPageProps> = ({ user, onLogout }) => {
	const { roomId } = useParams<{ roomId: string }>();
	const navigate = useNavigate();

	// Mock data for now - will be replaced with real data from backend
	const [room, setRoom] = useState<Room | null>({
		id: roomId || 'mock-room',
		name: 'Sample Room',
		description: 'A sample room for testing',
		createdBy: 'user123',
		createdAt: new Date().toISOString(),
		isPrivate: false,
		maxUsers: 10,
		currentUsers: 3,
		mediaQueue: [],
	});

	const [users, setUsers] = useState<RoomUser[]>([
		{
			userId: 'user123',
			username: 'HostUser',
			joinedAt: new Date().toISOString(),
			isHost: true,
			isActive: true,
		},
		{
			userId: 'user456',
			username: 'GuestUser1',
			joinedAt: new Date().toISOString(),
			isHost: false,
			isActive: true,
		},
		{
			userId: 'user789',
			username: 'GuestUser2',
			joinedAt: new Date().toISOString(),
			isHost: false,
			isActive: true,
		},
	]);

	const [messages, setMessages] = useState<RoomMessage[]>([
		{
			id: '1',
			roomId: roomId || '',
			userId: 'system',
			username: 'System',
			message: 'Welcome to the room!',
			timestamp: new Date().toISOString(),
			type: 'system',
		},
		{
			id: '2',
			roomId: roomId || '',
			userId: 'user123',
			username: 'HostUser',
			message: 'Hello everyone!',
			timestamp: new Date().toISOString(),
			type: 'text',
		},
		{
			id: '3',
			roomId: roomId || '',
			userId: 'user456',
			username: 'GuestUser1',
			message: 'Hi there!',
			timestamp: new Date().toISOString(),
			type: 'text',
		},
	]);

	const [newMessage, setNewMessage] = useState('');
	const [media, setMedia] = useState<Media[]>([]);

	useEffect(() => {
		// TODO: Load room data, users, messages, and media from backend
		console.log('Loading room:', roomId);
	}, [roomId]);

	const handleSendMessage = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newMessage.trim()) return;

		const message: RoomMessage = {
			id: Date.now().toString(),
			roomId: roomId || '',
			userId: user.id,
			username: user.username,
			message: newMessage.trim(),
			timestamp: new Date().toISOString(),
			type: 'text',
		};

		setMessages((prev) => [...prev, message]);
		setNewMessage('');
	};

	const handleLeaveRoom = () => {
		// TODO: Implement room leaving logic
		navigate('/rooms');
	};

	const handleMediaUpload = (file: File, title: string, description?: string) => {
		// TODO: Implement media upload to room
		console.log('Uploading media to room:', { file, title, description });
	};

	const handleMediaDelete = (mediaId: string) => {
		// TODO: Implement media deletion from room
		setMedia((prev) => prev.filter((m) => m.id !== mediaId));
	};

	if (!room) {
		return (
			<DashboardLayout
				user={user}
				onLogout={onLogout}
			>
				<div>
					<h1>Room Not Found</h1>
					<p>The room you're looking for doesn't exist.</p>
					<Button onClick={() => navigate('/rooms')}>Back to Rooms</Button>
				</div>
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout
			user={user}
			onLogout={onLogout}
		>
			<div>
				<div>
					<h1>{room.name}</h1>
					{room.description && <p>{room.description}</p>}
					<p>Room Code: {room.id}</p>
					<p>
						Users: {room.currentUsers}/{room.maxUsers}
					</p>
					<Button onClick={handleLeaveRoom}>Leave Room</Button>
				</div>

				<div>
					{/* Media Section */}
					<div>
						<h2>Media</h2>
						<MediaGrid
							media={media}
							onDelete={handleMediaDelete}
							emptyMessage='No media in this room yet. Upload some to get started!'
						/>
						{/* TODO: Add media upload component */}
					</div>

					{/* Users and Chat Section */}
					<div>
						{/* Users List */}
						<div>
							<h3>Users in Room ({users.length})</h3>
							<div>
								{users.map((user) => (
									<div key={user.userId}>
										<span>{user.username}</span>
										{user.isHost && <span>👑</span>}
										<span>{user.isActive ? '🟢' : '🔴'}</span>
									</div>
								))}
							</div>
						</div>

						{/* Messages */}
						<div>
							<h3>Messages</h3>
							<div>
								{messages.map((message) => (
									<div key={message.id}>
										<span>{message.username}:</span>
										<span>{message.message}</span>
										<span>{new Date(message.timestamp).toLocaleTimeString()}</span>
									</div>
								))}
							</div>

							<form onSubmit={handleSendMessage}>
								<input
									type='text'
									value={newMessage}
									onChange={(e) => setNewMessage(e.target.value)}
									placeholder='Type a message...'
									required
								/>
								<Button type='submit'>Send</Button>
							</form>
						</div>
					</div>
				</div>
			</div>
		</DashboardLayout>
	);
};
