import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { useMedia } from '../../../features/media/hooks/useMedia';
import { useRoomSocket } from '../../../features/rooms/hooks/useRoomSocket';
import { Media } from '../../../types';
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
	const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [isLocalAction, setIsLocalAction] = useState(false);
	const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);

	// Use the media hook to fetch user's media
	const { media: userMedia, isLoading: mediaLoading, error: mediaError, fetchMedia } = useMedia();

	// Use the socket hook for real-time functionality
	const {
		isConnected,
		isJoined,
		users,
		messages,
		mediaQueue: socketMediaQueue,
		error: socketError,
		sendMessage,
		leaveRoom,
		addToQueue: socketAddToQueue,
		removeFromQueue: socketRemoveFromQueue,
		clearQueue: socketClearQueue,
		mediaPlay: socketMediaPlay,
		mediaPause: socketMediaPause,
		mediaSeek: socketMediaSeek,
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

	// Fetch user's media when component mounts
	useEffect(() => {
		if (user) {
			fetchMedia();
		}
	}, [user]); // Remove fetchMedia dependency to prevent infinite re-renders

	// Debug: Log media data when it changes
	useEffect(() => {
		console.log('RoomPage: userMedia changed:', userMedia);
	}, [userMedia]);

	// Auto-play first item in queue when queue changes
	useEffect(() => {
		if (socketMediaQueue.length > 0 && mediaRef.current) {
			// Auto-play the first item in the queue
			mediaRef.current.play().catch((error) => {
				console.log('Auto-play failed:', error);
				// Auto-play might be blocked by browser policy, that's okay
			});
		}
	}, [socketMediaQueue]);

	// Handle incoming media sync events
	useEffect(() => {
		if (!isConnected || !isJoined) return;

		// Create event handlers for media sync events
		const handleMediaPlay = (event: CustomEvent) => {
			const data = event.detail;
			console.log('Media play event received:', data);

			// Ignore if this is our own action
			if (isLocalAction) return;

			setIsLocalAction(true);
			setIsPlaying(true);
			setCurrentTime(data.currentTime);

			// Sync media element
			if (mediaRef.current) {
				mediaRef.current.currentTime = data.currentTime;
				mediaRef.current.play().catch(console.error);
			}

			setTimeout(() => setIsLocalAction(false), 100);
		};

		const handleMediaPause = (event: CustomEvent) => {
			const data = event.detail;
			console.log('Media pause event received:', data);

			// Ignore if this is our own action
			if (isLocalAction) return;

			setIsLocalAction(true);
			setIsPlaying(false);
			setCurrentTime(data.currentTime);

			// Sync media element
			if (mediaRef.current) {
				mediaRef.current.currentTime = data.currentTime;
				mediaRef.current.pause();
			}

			setTimeout(() => setIsLocalAction(false), 100);
		};

		const handleMediaSeek = (event: CustomEvent) => {
			const data = event.detail;
			console.log('Media seek event received:', data);

			// Ignore if this is our own action
			if (isLocalAction) return;

			setIsLocalAction(true);
			setCurrentTime(data.currentTime);

			// Sync media element
			if (mediaRef.current) {
				mediaRef.current.currentTime = data.currentTime;
			}

			setTimeout(() => setIsLocalAction(false), 100);
		};

		// Add event listeners
		window.addEventListener('media-play', handleMediaPlay as EventListener);
		window.addEventListener('media-pause', handleMediaPause as EventListener);
		window.addEventListener('media-seek', handleMediaSeek as EventListener);

		return () => {
			window.removeEventListener('media-play', handleMediaPlay as EventListener);
			window.removeEventListener('media-pause', handleMediaPause as EventListener);
			window.removeEventListener('media-seek', handleMediaSeek as EventListener);
		};
	}, [isConnected, isJoined, isLocalAction]);

	const handleSendMessage = () => {
		if (!newMessage.trim()) return;

		sendMessage(newMessage.trim());
		setNewMessage('');
	};

	const handleLeaveRoom = () => {
		leaveRoom();
		navigate('/');
	};

	// Media queue management
	const handleAddToQueue = (media: Media, position: 'top' | 'end' = 'end') => {
		if (!roomCode || !media) return;

		console.log('handleAddToQueue called with:', { media, position, roomCode });
		console.log('Socket methods available:', { socketAddToQueue, isConnected, isJoined });

		// Send to socket to sync with all users (same as test button)
		socketAddToQueue(media, position);
		console.log('Added to queue via socket:', media.title, position);
	};

	const handleRemoveFromQueue = (queueItemId: string) => {
		// Send to socket to sync with all users
		socketRemoveFromQueue(queueItemId);
	};

	const handlePlayPause = () => {
		setIsPlaying(!isPlaying);
		// TODO: Emit socket event to sync with other users
	};

	const handleSeek = (newTime: number) => {
		setCurrentTime(newTime);
		// TODO: Emit socket event to sync with other users
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

				{/* Media Queue Section */}
				<div
					style={{
						width: '300px',
						backgroundColor: '#f8f9fa',
						borderRight: '1px solid #dee2e6',
						display: 'flex',
						flexDirection: 'column',
					}}
				>
					{/* Media Queue Header */}
					<div
						style={{
							padding: '20px 20px 15px 20px',
							borderBottom: '1px solid #dee2e6',
						}}
					>
						<h3 style={{ margin: '0 0 15px 0' }}>Media Queue</h3>

						{/* Media Selection Dropdown */}
						<div style={{ marginBottom: '15px' }}>
							{mediaLoading ? (
								<div style={{ padding: '8px', textAlign: 'center', color: '#6c757d' }}>
									Loading media...
								</div>
							) : mediaError ? (
								<div style={{ padding: '8px', textAlign: 'center', color: '#dc3545' }}>
									Error loading media: {mediaError}
									<br />
									<button
										onClick={fetchMedia}
										style={{
											marginTop: '8px',
											padding: '4px 8px',
											fontSize: '12px',
											backgroundColor: '#6c757d',
											color: 'white',
											border: 'none',
											borderRadius: '4px',
											cursor: 'pointer',
										}}
									>
										Retry
									</button>
								</div>
							) : (
								<select
									value={selectedMedia?.id || ''}
									onChange={(e) => {
										const media = userMedia?.find((m) => m.id === e.target.value);
										setSelectedMedia(media || null);
									}}
									style={{
										width: '100%',
										padding: '8px',
										border: '1px solid #dee2e6',
										borderRadius: '4px',
										fontSize: '14px',
									}}
								>
									<option value=''>Select media to add...</option>
									{userMedia && userMedia.length > 0 ? (
										userMedia.map((media) => (
											<option
												key={media.id}
												value={media.id}
											>
												{media.title}
											</option>
										))
									) : (
										<option
											value=''
											disabled
										>
											No media available
										</option>
									)}
								</select>
							)}
						</div>

						{/* Add to Queue Buttons */}
						{selectedMedia && (
							<div style={{ display: 'flex', gap: '8px' }}>
								<Button
									onClick={() => handleAddToQueue(selectedMedia, 'top')}
									variant='secondary'
								>
									Add to Top
								</Button>
								<Button
									onClick={() => handleAddToQueue(selectedMedia, 'end')}
									variant='secondary'
								>
									Add to End
								</Button>
							</div>
						)}

						{/* Queue Management Buttons */}
						{socketMediaQueue.length > 0 && (
							<div style={{ marginTop: '10px' }}>
								<button
									onClick={() => socketClearQueue()}
									style={{
										fontSize: '12px',
										padding: '4px 8px',
										backgroundColor: '#dc3545',
										color: 'white',
										border: 'none',
										borderRadius: '4px',
										cursor: 'pointer',
									}}
								>
									Clear Queue
								</button>
							</div>
						)}
					</div>

					{/* Queue List */}
					<div
						style={{
							flex: 1,
							padding: '15px 20px',
							overflowY: 'auto',
						}}
					>
						{socketMediaQueue.length === 0 ? (
							<p style={{ color: '#6c757d', textAlign: 'center', marginTop: '20px' }}>
								No media in queue
							</p>
						) : (
							<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
								{socketMediaQueue.map((item) => (
									<div
										key={item.id}
										style={{
											padding: '12px',
											backgroundColor: 'white',
											borderRadius: '6px',
											border: '1px solid #dee2e6',
										}}
									>
										<div
											style={{
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'flex-start',
												marginBottom: '8px',
											}}
										>
											<span style={{ fontWeight: 'bold', fontSize: '14px' }}>{item.title}</span>
											<button
												onClick={() => handleRemoveFromQueue(item.id)}
												style={{
													background: 'none',
													border: 'none',
													color: '#dc3545',
													cursor: 'pointer',
													fontSize: '16px',
												}}
											>
												×
											</button>
										</div>
									</div>
								))}
							</div>
						)}
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
					{socketMediaQueue.length === 0 ? (
						<div style={{ textAlign: 'center' }}>
							<h2>Media Streaming Area</h2>
							<p>Video/audio content will appear here</p>
						</div>
					) : (
						<div style={{ textAlign: 'center' }}>
							{/* Media Player */}
							<div style={{ width: '400px', height: '225px', margin: '0 auto' }}>
								{socketMediaQueue[0].mimeType.startsWith('video/') ? (
									<video
										ref={mediaRef as React.RefObject<HTMLVideoElement>}
										controls
										autoPlay
										style={{
											width: '100%',
											height: '100%',
											borderRadius: '8px',
										}}
										onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
										onPlay={(e) => {
											console.log('Video play event triggered by user:', user?.username);
											setIsPlaying(true);
											// Emit socket event to sync with other users
											if (!isLocalAction) {
												console.log('Emitting video play socket event from user:', user?.username);
												socketMediaPlay(roomCode || '', e.currentTarget.currentTime);
											}
										}}
										onPause={(e) => {
											console.log('Video pause event triggered by user:', user?.username);
											setIsPlaying(false);
											// Emit socket event to sync with other users
											if (!isLocalAction) {
												console.log('Emitting video pause socket event from user:', user?.username);
												socketMediaPause(roomCode || '', e.currentTarget.currentTime);
											}
										}}
									>
										<source
											src={socketMediaQueue[0].url}
											type={socketMediaQueue[0].mimeType}
										/>
										Your browser does not support the video tag.
									</video>
								) : socketMediaQueue[0].mimeType.startsWith('audio/') ? (
									<audio
										ref={mediaRef as React.RefObject<HTMLAudioElement>}
										controls
										autoPlay
										style={{
											width: '100%',
											borderRadius: '8px',
										}}
										onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
										onPlay={(e) => {
											console.log('Audio play event triggered by user:', user?.username);
											setIsPlaying(true);
											// Emit socket event to sync with other users
											if (!isLocalAction) {
												console.log('Emitting audio play socket event from user:', user?.username);
												socketMediaPlay(roomCode || '', e.currentTarget.currentTime);
											}
										}}
										onPause={(e) => {
											console.log('Audio pause event triggered by user:', user?.username);
											setIsPlaying(false);
											// Emit socket event to sync with other users
											if (!isLocalAction) {
												console.log('Emitting audio pause socket event from user:', user?.username);
												socketMediaPause(roomCode || '', e.currentTarget.currentTime);
											}
										}}
									>
										<source
											src={socketMediaQueue[0].url}
											type={socketMediaQueue[0].mimeType}
										/>
										Your browser does not support the audio tag.
									</audio>
								) : (
									<div
										style={{
											width: '100%',
											borderRadius: '8px',
											backgroundColor: '#333',
											border: '2px dashed #666',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											color: 'white',
											padding: '20px',
										}}
									>
										<p>Unsupported media type</p>
									</div>
								)}
							</div>
						</div>
					)}
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
