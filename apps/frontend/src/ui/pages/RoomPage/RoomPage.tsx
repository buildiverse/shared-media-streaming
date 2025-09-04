import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import React, { useEffect, useRef, useState } from 'react';
import { Loader, LogOut, MessageCircle, Play, Users, X } from 'react-feather';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useMedia } from '../../../features/media/hooks/useMedia';
import { useRoomSocket } from '../../../features/rooms/hooks/useRoomSocket';
import { Media } from '../../../types';

// These interfaces are defined but not currently used
// interface User {
// 	id: string;
// 	username: string;
// 	isHost: boolean;
// }

// interface Message {
// 	id: string;
// 	userId: string;
// 	username: string;
// 	content: string;
// 	timestamp: Date;
// }

export const RoomPage: React.FC = () => {
	const { roomCode } = useParams<{ roomCode: string }>();
	const navigate = useNavigate();
	const { user } = useAuth();

	const [newMessage, setNewMessage] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
	const [_isPlaying, setIsPlaying] = useState(false);
	const [_currentTime, setCurrentTime] = useState(0);
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
		// mediaSeek: socketMediaSeek,
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
			console.log('Connected, setting loading to falsse');
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

	// const handlePlayPause = () => {
	// 	setIsPlaying(!isPlaying);
	// 	// TODO: Emit socket event to sync with other users
	// };

	// const handleSeek = (newTime: number) => {
	// 	setCurrentTime(newTime);
	// 	// TODO: Emit socket event to sync with other users
	// };

	if (isLoading) {
		return (
			<div className='flex flex-col items-center justify-center min-h-screen bg-background px-6'>
				<Card className='bg-background/40 backdrop-blur-lg border-border/30 p-8'>
					<CardContent className='flex flex-col items-center gap-4'>
						<Loader className='w-8 h-8 text-primary animate-spin' />
						<p className='text-white/80'>Loading room...</p>
						{socketError && (
							<div className='mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg'>
								<p className='text-red-400 font-medium'>Connection Error: {socketError}</p>
								<p className='text-red-400/80 text-sm mt-1'>
									Make sure the backend server is running on port 3000
								</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className='h-screen flex flex-col bg-background'>
			{/* Header */}
			<header className='p-4 bg-background/40 backdrop-blur-lg border-b border-border/30 flex justify-between items-center'>
				<div>
					<h1 className='text-2xl font-bold text-white m-0'>Room: {roomCode}</h1>
					<div className='flex items-center gap-2 mt-1'>
						<div
							className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
						></div>
						<p className='text-white/60 text-sm m-0'>
							{isConnected ? 'Connected' : 'Disconnected'}
						</p>
					</div>
					{socketError && <p className='text-red-400 text-sm mt-1 m-0'>⚠️ {socketError}</p>}
				</div>
				<Button
					onClick={handleLeaveRoom}
					variant='outline'
					className='border-red-500/50 text-red-400 hover:bg-red-500/10'
				>
					<LogOut className='w-4 h-4 mr-2' />
					Leave Room
				</Button>
			</header>

			{/* Main Content */}
			<div className='flex-1 flex overflow-hidden'>
				{/* Left Sidebar - Users */}
				<div className='w-64 bg-background/40 backdrop-blur-lg border-r border-border/30 p-4'>
					<Card className='bg-background/60 border-border/50'>
						<CardHeader className='pb-3'>
							<CardTitle className='text-white text-lg flex items-center gap-2'>
								<Users className='w-5 h-5' />
								Users ({users.length})
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-2'>
							{users.map((roomUser) => (
								<div
									key={roomUser.id}
									className='p-3 bg-background/80 border border-border/50 rounded-lg flex items-center gap-3'
								>
									<div
										className={`w-2 h-2 rounded-full ${
											roomUser.isHost ? 'bg-green-500' : 'bg-primary'
										}`}
									/>
									<span className={`text-white ${roomUser.isHost ? 'font-bold' : 'font-normal'}`}>
										{roomUser.username}
									</span>
									{roomUser.isHost && (
										<span className='text-xs bg-green-500 text-white px-2 py-1 rounded-full'>
											Host
										</span>
									)}
								</div>
							))}
						</CardContent>
					</Card>
				</div>

				{/* Media Queue Section */}
				<div className='w-80 bg-background/40 backdrop-blur-lg border-r border-border/30 flex flex-col'>
					<Card className='bg-background/60 border-border/50 h-full flex flex-col'>
						<CardHeader className='pb-3'>
							<CardTitle className='text-white text-lg flex items-center gap-2'>
								<Play className='w-5 h-5' />
								Media Queue
							</CardTitle>
						</CardHeader>
						<CardContent className='flex-1 flex flex-col space-y-4'>
							{/* Media Selection */}
							<div>
								{mediaLoading ? (
									<div className='p-3 text-center text-white/60'>
										<Loader className='w-4 h-4 animate-spin mx-auto mb-2' />
										Loading media...
									</div>
								) : mediaError ? (
									<div className='p-3 text-center'>
										<p className='text-red-400 text-sm mb-2'>Error loading media: {mediaError}</p>
										<Button
											onClick={fetchMedia}
											size='sm'
											variant='outline'
											className='border-red-500/50 text-red-400 hover:bg-red-500/10'
										>
											Retry
										</Button>
									</div>
								) : (
									<Select
										value={selectedMedia?.id || ''}
										onValueChange={(value) => {
											const media = userMedia?.find((m) => m.id === value);
											setSelectedMedia(media || null);
										}}
									>
										<SelectTrigger className='bg-background/80 border-border/50 text-white'>
											<SelectValue placeholder='Select media to add...' />
										</SelectTrigger>
										<SelectContent className='bg-background border-border/50'>
											{userMedia && userMedia.length > 0 ? (
												userMedia.map((media) => (
													<SelectItem
														key={media.id}
														value={media.id}
														className='text-white hover:bg-background/80'
													>
														{media.title}
													</SelectItem>
												))
											) : (
												<SelectItem
													value=''
													disabled
													className='text-white/60'
												>
													No media available
												</SelectItem>
											)}
										</SelectContent>
									</Select>
								)}
							</div>

							{/* Add to Queue Buttons */}
							{selectedMedia && (
								<div className='flex gap-2'>
									<Button
										onClick={() => handleAddToQueue(selectedMedia, 'top')}
										size='sm'
										className='flex-1 bg-primary hover:bg-primary/90 text-primary-foreground'
									>
										Add to Top
									</Button>
									<Button
										onClick={() => handleAddToQueue(selectedMedia, 'end')}
										size='sm'
										variant='outline'
										className='flex-1 border-white/20 text-white hover:bg-white/10'
									>
										Add to End
									</Button>
								</div>
							)}

							{/* Queue Management */}
							{socketMediaQueue.length > 0 && (
								<Button
									onClick={() => socketClearQueue()}
									size='sm'
									variant='outline'
									className='border-red-500/50 text-red-400 hover:bg-red-500/10'
								>
									<X className='w-4 h-4 mr-2' />
									Clear Queue
								</Button>
							)}
							{/* Queue List */}
							<div className='flex-1 overflow-y-auto space-y-2'>
								{socketMediaQueue.length === 0 ? (
									<p className='text-white/60 text-center mt-8'>No media in queue</p>
								) : (
									<div className='space-y-2'>
										{socketMediaQueue.map((item) => (
											<div
												key={item.id}
												className='p-3 bg-background/80 border border-border/50 rounded-lg'
											>
												<div className='flex justify-between items-start'>
													<span className='text-white font-medium text-sm'>{item.title}</span>
													<Button
														onClick={() => handleRemoveFromQueue(item.id)}
														size='sm'
														variant='ghost'
														className='h-6 w-6 p-0 text-red-400 hover:bg-red-500/10'
													>
														<X className='w-4 h-4' />
													</Button>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Center - Media Streaming Area */}
				<div className='flex-1 bg-black flex flex-col items-center justify-center text-white'>
					{socketMediaQueue.length === 0 ? (
						<div className='text-center'>
							<h2 className='text-2xl font-bold text-white mb-2'>Media Streaming Area</h2>
							<p className='text-white/60'>Video/audio content will appear here</p>
						</div>
					) : (
						<div className='text-center'>
							{/* Media Player */}
							<div className='w-full max-w-4xl mx-auto'>
								{socketMediaQueue[0].mimeType.startsWith('video/') ? (
									<video
										ref={mediaRef as React.RefObject<HTMLVideoElement>}
										controls
										autoPlay
										className='w-full h-auto rounded-lg'
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
									<div className='bg-background/20 backdrop-blur-lg border border-border/30 rounded-lg p-8'>
										<audio
											ref={mediaRef as React.RefObject<HTMLAudioElement>}
											controls
											autoPlay
											className='w-full rounded-lg'
											onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
											onPlay={(e) => {
												console.log('Audio play event triggered by user:', user?.username);
												setIsPlaying(true);
												// Emit socket event to sync with other users
												if (!isLocalAction) {
													console.log(
														'Emitting audio play socket event from user:',
														user?.username,
													);
													socketMediaPlay(roomCode || '', e.currentTarget.currentTime);
												}
											}}
											onPause={(e) => {
												console.log('Audio pause event triggered by user:', user?.username);
												setIsPlaying(false);
												// Emit socket event to sync with other users
												if (!isLocalAction) {
													console.log(
														'Emitting audio pause socket event from user:',
														user?.username,
													);
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
									</div>
								) : (
									<div className='w-full max-w-md mx-auto bg-background/20 backdrop-blur-lg border-2 border-dashed border-border/50 rounded-lg flex items-center justify-center text-white p-8'>
										<p>Unsupported media type</p>
									</div>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Right Sidebar - Messages */}
				<div className='w-80 bg-background/40 backdrop-blur-lg border-l border-border/30 flex flex-col'>
					<Card className='bg-background/60 border-border/50 h-full flex flex-col'>
						<CardHeader className='pb-3'>
							<CardTitle className='text-white text-lg flex items-center gap-2'>
								<MessageCircle className='w-5 h-5' />
								Chat
							</CardTitle>
						</CardHeader>
						<CardContent className='flex-1 flex flex-col space-y-3'>
							{/* Messages List */}
							<div className='flex-1 overflow-y-auto space-y-3'>
								{messages.map((message) => (
									<div
										key={message.id}
										className='p-3 bg-background/80 border border-border/50 rounded-lg'
									>
										<div className='flex justify-between items-start mb-2'>
											<span
												className={`font-medium text-sm ${
													message.userId === user?.id ? 'text-primary' : 'text-white'
												}`}
											>
												{message.username}
											</span>
											<span className='text-xs text-white/60'>
												{new Date(message.timestamp).toLocaleTimeString()}
											</span>
										</div>
										<p className='text-white text-sm m-0 break-words'>{message.content}</p>
									</div>
								))}
							</div>

							{/* Message Input */}
							<div className='flex gap-2 pt-3 border-t border-border/30'>
								<Input
									type='text'
									value={newMessage}
									onChange={(e) => setNewMessage(e.target.value)}
									onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
									placeholder='Type a message...'
									className='flex-1 bg-background/80 border-border/50 text-white placeholder-white/50'
								/>
								<Button
									onClick={handleSendMessage}
									disabled={!newMessage.trim()}
									size='sm'
									className='bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed'
								>
									Send
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
};
