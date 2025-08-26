import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { useRoomSocket } from '../../../features/rooms/hooks/useRoomSocket';
import { Button } from '../../atoms/Button';

interface User {
	id: string;
	username: string;
	isHost: boolean;
}

interface Message {
	id: string;
	userId: string;
	username: string;
	content: string;
	timestamp: Date;
}

export const RoomPage: React.FC = () => {
	const { roomCode } = useParams<{ roomCode: string }>();
	const navigate = useNavigate();
	const { user } = useAuth();

	const [newMessage, setNewMessage] = useState('');
	const [isLoading, setIsLoading] = useState(true);

	// Use the socket hook for real-time functionality
	const {
		isConnected,
		users,
		messages,
		error: socketError,
		sendMessage,
		leaveRoom,
	} = useRoomSocket(roomCode || '');

	useEffect(() => {
		console.log('RoomPage useEffect:', { roomCode, user: !!user, isConnected });

		if (!roomCode) {
			// If no room code, wait a bit before redirecting to see if it loads
			console.log('No room code, waiting before redirect');
			const timer = setTimeout(() => {
				if (!roomCode) {
					console.log('Still no room code, redirecting to dashboard');
					navigate('/');
				}
			}, 1000);

			return () => clearTimeout(timer);
		}

		if (!user) {
			// If no user, wait for auth to load
			console.log('No user yet, waiting for auth');
			return;
		}

		// Set loading to false once connected
		if (isConnected) {
			console.log('Connected, setting loading to false');
			setIsLoading(false);
		}
	}, [roomCode, user, navigate, isConnected]);

	const handleSendMessage = () => {
		if (!newMessage.trim()) return;

		sendMessage(newMessage.trim());
		setNewMessage('');
	};

	const handleLeaveRoom = () => {
		leaveRoom();
		navigate('/');
	};

	if (isLoading) {
		return (
			<div style={{ padding: '20px', textAlign: 'center' }}>
				<div>Loading room...</div>
				{socketError && (
					<div style={{ marginTop: '20px', color: '#dc3545' }}>
						<strong>Connection Error:</strong> {socketError}
						<br />
						<small>Make sure the backend server is running on port 3000</small>
					</div>
				)}
			</div>
		);
	}

	return (
		<div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
			{/* Header */}
			<header
				style={{
					padding: '15px 20px',
					backgroundColor: '#f8f9fa',
					borderBottom: '1px solid #dee2e6',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
				<div>
					<h1 style={{ margin: 0, fontSize: '24px' }}>Room: {roomCode}</h1>
					<p style={{ margin: '5px 0 0 0', color: '#6c757d' }}>
						{isConnected ? '🟢 Connected' : '🔴 Disconnected'}
					</p>
					{socketError && <p style={{ margin: '5px 0 0 0', color: '#dc3545' }}>⚠️ {socketError}</p>}
				</div>
				<Button
					onClick={handleLeaveRoom}
					variant='secondary'
				>
					Leave Room
				</Button>
			</header>

			{/* Main Content */}
			<div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
				{/* Left Sidebar - Users */}
				<div
					style={{
						width: '250px',
						backgroundColor: '#f8f9fa',
						borderRight: '1px solid #dee2e6',
						padding: '20px',
					}}
				>
					<h3 style={{ margin: '0 0 15px 0' }}>Users ({users.length})</h3>
					<div>
						{users.map((roomUser) => (
							<div
								key={roomUser.id}
								style={{
									padding: '10px',
									marginBottom: '8px',
									backgroundColor: 'white',
									borderRadius: '6px',
									border: '1px solid #dee2e6',
									display: 'flex',
									alignItems: 'center',
									gap: '10px',
								}}
							>
								<div
									style={{
										width: '8px',
										height: '8px',
										borderRadius: '50%',
										backgroundColor: roomUser.isHost ? '#28a745' : '#007bff',
									}}
								/>
								<span style={{ fontWeight: roomUser.isHost ? 'bold' : 'normal' }}>
									{roomUser.username}
								</span>
								{roomUser.isHost && (
									<span
										style={{
											fontSize: '12px',
											backgroundColor: '#28a745',
											color: 'white',
											padding: '2px 6px',
											borderRadius: '10px',
										}}
									>
										Host
									</span>
								)}
							</div>
						))}
					</div>
				</div>

				{/* Center - Media Streaming Area */}
				<div
					style={{
						flex: 1,
						backgroundColor: '#000',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						color: 'white',
					}}
				>
					<div style={{ textAlign: 'center' }}>
						<h2>Media Streaming Area</h2>
						<p>Video/audio content will appear here</p>
						<div
							style={{
								width: '400px',
								height: '225px',
								backgroundColor: '#333',
								border: '2px dashed #666',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								borderRadius: '8px',
							}}
						>
							<p>Media Player</p>
						</div>
					</div>
				</div>

				{/* Right Sidebar - Messages */}
				<div
					style={{
						width: '300px',
						backgroundColor: '#f8f9fa',
						borderLeft: '1px solid #dee2e6',
						display: 'flex',
						flexDirection: 'column',
					}}
				>
					{/* Messages Header */}
					<div
						style={{
							padding: '20px 20px 15px 20px',
							borderBottom: '1px solid #dee2e6',
						}}
					>
						<h3 style={{ margin: 0 }}>Chat</h3>
					</div>

					{/* Messages List */}
					<div
						style={{
							flex: 1,
							padding: '15px 20px',
							overflowY: 'auto',
							display: 'flex',
							flexDirection: 'column',
							gap: '10px',
						}}
					>
						{messages.map((message) => (
							<div
								key={message.id}
								style={{
									padding: '10px',
									backgroundColor: 'white',
									borderRadius: '8px',
									border: '1px solid #dee2e6',
								}}
							>
								<div
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										marginBottom: '5px',
									}}
								>
									<span
										style={{
											fontWeight: 'bold',
											color: message.userId === user?.id ? '#007bff' : '#495057',
										}}
									>
										{message.username}
									</span>
									<span
										style={{
											fontSize: '12px',
											color: '#6c757d',
										}}
									>
										{new Date(message.timestamp).toLocaleTimeString()}
									</span>
								</div>
								<p style={{ margin: 0, wordBreak: 'break-word' }}>{message.content}</p>
							</div>
						))}
					</div>

					{/* Message Input */}
					<div
						style={{
							padding: '15px 20px',
							borderTop: '1px solid #dee2e6',
							backgroundColor: 'white',
						}}
					>
						<div style={{ display: 'flex', gap: '10px' }}>
							<input
								type='text'
								value={newMessage}
								onChange={(e) => setNewMessage(e.target.value)}
								onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
								placeholder='Type a message...'
								style={{
									flex: 1,
									padding: '8px 12px',
									border: '1px solid #dee2e6',
									borderRadius: '4px',
									fontSize: '14px',
								}}
							/>
							<Button
								onClick={handleSendMessage}
								disabled={!newMessage.trim()}
							>
								Send
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
