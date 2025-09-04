// AppRoutes Component

import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import {
	Link,
	Navigate,
	Route,
	BrowserRouter as Router,
	Routes,
	useNavigate,
} from 'react-router-dom';
import { StorageUsage } from '../../components/StorageUsage';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { RegisterPage } from '../../features/auth/pages/RegisterPage';
import { MediaUpload } from '../../features/media/components/MediaUpload';
import { useMedia } from '../../features/media/hooks/useMedia';
import { useRooms } from '../../features/rooms/hooks/useRooms';
import { Calculator } from '../../routes/Calculator';
import { Entry } from '../../routes/Entry';
import { Error404 } from '../../routes/Error404';
import { MediaGrid } from '../../ui/organisms/MediaGrid';
import { RoomPage } from '../../ui/pages/RoomPage';
import { DashboardLayout } from '../../ui/templates/DashboardLayout';
import { useAuth } from '../providers/AuthProvider';

// Protected Route Component
interface ProtectedRouteProps {
	children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
	const { isAuthenticated, isLoading } = useAuth();

	console.log('ProtectedRoute:', { isAuthenticated, isLoading });

	if (isLoading) {
		return <div style={{ padding: '20px', textAlign: 'center' }}>Loading authentication...</div>;
	}

	if (!isAuthenticated) {
		console.log('ProtectedRoute: not authenticated, redirecting to login');
		return (
			<Navigate
				to='/login'
				replace
			/>
		);
	}

	console.log('ProtectedRoute: authenticated, rendering children');
	return <>{children}</>;
};

// Main AppRoutes Component
export const AppRoutes: React.FC = () => {
	return (
		<Router>
			<AppRoutesContent />
		</Router>
	);
};

// Separate component that uses hooks inside Router context
const AppRoutesContent: React.FC = () => {
	const { user, logout } = useAuth();

	const handleLogout = () => {
		logout();
		// Navigate to login after logout
		window.location.href = '/login';
	};

	return (
		<Routes>
			{/* Public routes */}
			<Route
				path='/splash'
				element={<Entry />}
			/>

			{/* Auth routes */}
			<Route
				path='/login'
				element={<LoginPage />}
			/>

			<Route
				path='/register'
				element={<RegisterPage />}
			/>

			<Route
				path='/calculator'
				element={<Calculator />}
			/>

			<Route
				path='/404'
				element={<Error404 />}
			/>

			{/* Storage upgrade success/cancel routes */}
			<Route
				path='/storage/upgrade/success'
				element={<StorageUpgradeSuccess />}
			/>
			<Route
				path='/storage/upgrade/cancel'
				element={<StorageUpgradeCancel />}
			/>

			{/* Protected routes */}
			<Route
				path='/'
				element={
					<ProtectedRoute>
						<DashboardLayout
							user={user!}
							onLogout={handleLogout}
						>
							<HomeDashboard />
						</DashboardLayout>
					</ProtectedRoute>
				}
			/>

			<Route
				path='/upload'
				element={
					<ProtectedRoute>
						<DashboardLayout
							user={user!}
							onLogout={handleLogout}
						>
							<UploadPage />
						</DashboardLayout>
					</ProtectedRoute>
				}
			/>

			<Route
				path='/media'
				element={
					<ProtectedRoute>
						<DashboardLayout
							user={user!}
							onLogout={handleLogout}
						>
							<MediaDashboard />
						</DashboardLayout>
					</ProtectedRoute>
				}
			/>

			<Route
				path='/rooms'
				element={
					<ProtectedRoute>
						<DashboardLayout
							user={user!}
							onLogout={handleLogout}
						>
							<RoomManagement />
						</DashboardLayout>
					</ProtectedRoute>
				}
			/>

			<Route
				path='/join-room'
				element={
					<ProtectedRoute>
						<DashboardLayout
							user={user!}
							onLogout={handleLogout}
						>
							<JoinRoom />
						</DashboardLayout>
					</ProtectedRoute>
				}
			/>

			<Route
				path='/room/:roomCode'
				element={
					<ProtectedRoute>
						<RoomPage />
					</ProtectedRoute>
				}
			/>

			{/* Catch all route */}
			<Route
				path='*'
				element={
					<Navigate
						to='/splash'
						replace
					/>
				}
			/>
		</Routes>
	);
};

// Home Dashboard Component
const HomeDashboard: React.FC = () => {
	const { user } = useAuth();

	return (
		<div className='flex flex-col items-center justify-center min-h-[calc(100vh-160px)] px-6 text-center'>
			{/* Welcome Section */}
			<div className='mb-8'>
				<h1 className='text-4xl font-bold text-white mb-3'>
					Welcome Home, <span className='text-primary'>{user?.username}</span>!
				</h1>
				<p className='text-lg text-white/80'>Your media streaming dashboard</p>
			</div>

			{/* Quick Actions */}
			<div className='mb-8'>
				<h2 className='text-2xl font-semibold text-white mb-4'>Quick Actions</h2>
				<div className='flex flex-col sm:flex-row gap-4'>
					<Button
						asChild
						size='default'
						className='px-6'
					>
						<Link to='/upload'>Upload Media</Link>
					</Button>
					<Button
						asChild
						variant='outline'
						size='default'
						className='px-6 border-white text-white hover:bg-white hover:text-background'
					>
						<Link to='/media'>View Media</Link>
					</Button>
				</div>
			</div>

			{/* Room Management */}
			<div>
				<h2 className='text-2xl font-semibold text-white mb-4'>Room Management</h2>
				<div className='flex flex-col sm:flex-row gap-4'>
					<Button
						asChild
						size='default'
						className='px-6'
					>
						<Link to='/rooms'>Manage Rooms</Link>
					</Button>
					<Button
						asChild
						variant='outline'
						size='default'
						className='px-6 border-white text-white hover:bg-white hover:text-background'
					>
						<Link to='/join-room'>Join Room</Link>
					</Button>
				</div>
			</div>
		</div>
	);
};

// Storage Upgrade Success Page
const StorageUpgradeSuccess: React.FC = () => {
	const { isAuthenticated } = useAuth();
	const [sessionId, setSessionId] = React.useState<string | null>(null);
	const [isConfirming, setIsConfirming] = React.useState(false);
	const [confirmed, setConfirmed] = React.useState(false);
	const [countdown, setCountdown] = React.useState(3);

	React.useEffect(() => {
		// Get session_id from URL params
		const urlParams = new URLSearchParams(window.location.search);
		const id = urlParams.get('session_id');
		setSessionId(id);
	}, []);

	// Auto-confirm checkout when session_id is present
	React.useEffect(() => {
		if (sessionId && isAuthenticated && !isConfirming && !confirmed) {
			const confirmCheckout = async () => {
				setIsConfirming(true);
				try {
					const { storageService } = await import('../../services/storage');
					const result = await storageService.confirmCheckout(sessionId);
					if (result.success && result.data.upgraded) {
						setConfirmed(true);
						// Start countdown and redirect
						const interval = setInterval(() => {
							setCountdown((prev) => {
								if (prev <= 1) {
									clearInterval(interval);
									window.location.href = '/media';
									return 0;
								}
								return prev - 1;
							});
						}, 1000);
					}
				} catch (error) {
					console.error('Failed to confirm checkout:', error);
				} finally {
					setIsConfirming(false);
				}
			};
			confirmCheckout();
		}
	}, [sessionId, isAuthenticated, isConfirming, confirmed]);

	if (!isAuthenticated) {
		return (
			<div className='flex flex-col items-center justify-center min-h-screen px-6 text-center'>
				<div className='bg-background/40 backdrop-blur-lg border-border/30 rounded-lg p-8 max-w-md'>
					<h1 className='text-2xl font-bold text-white mb-4'>Please Log In</h1>
					<p className='text-white/80 mb-6'>You need to be logged in to view this page.</p>
					<Button asChild>
						<Link to='/login'>Go to Login</Link>
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className='flex flex-col items-center justify-center min-h-screen px-6 text-center'>
			<div className='bg-background/40 backdrop-blur-lg border-border/30 rounded-lg p-8 max-w-md'>
				{isConfirming ? (
					<>
						<div className='text-blue-400 text-6xl mb-4'>⏳</div>
						<h1 className='text-2xl font-bold text-white mb-4'>Confirming Payment...</h1>
						<p className='text-white/80 mb-6'>
							Please wait while we confirm your payment and upgrade your storage.
						</p>
					</>
				) : confirmed ? (
					<>
						<div className='text-green-400 text-6xl mb-4'>✓</div>
						<h1 className='text-2xl font-bold text-white mb-4'>Payment Successful!</h1>
						<p className='text-white/80 mb-6'>
							Your storage has been upgraded successfully. You can now upload more media files.
						</p>
						<p className='text-white/60 text-sm mb-6'>
							Redirecting to media library in {countdown} seconds...
						</p>
					</>
				) : (
					<>
						<div className='text-green-400 text-6xl mb-4'>✓</div>
						<h1 className='text-2xl font-bold text-white mb-4'>Payment Successful!</h1>
						<p className='text-white/80 mb-6'>
							Your payment was processed. Storage upgrade is being applied...
						</p>
					</>
				)}
				{sessionId && (
					<p className='text-white/60 text-sm mb-6'>
						Session ID: {sessionId}
						{!sessionId.startsWith('cs_test_') && !sessionId.startsWith('cs_live_') && (
							<span className='text-yellow-400 ml-2'>⚠ Invalid session format</span>
						)}
					</p>
				)}
				<div className='flex flex-col sm:flex-row gap-3'>
					<Button asChild>
						<Link to='/media'>View Media Library</Link>
					</Button>
					<Button
						asChild
						variant='outline'
						className='border-white/20 text-white hover:bg-white/10'
					>
						<Link to='/upload'>Upload Media</Link>
					</Button>
				</div>
			</div>
		</div>
	);
};

// Storage Upgrade Cancel Page
const StorageUpgradeCancel: React.FC = () => {
	const { isAuthenticated } = useAuth();

	if (!isAuthenticated) {
		return (
			<div className='flex flex-col items-center justify-center min-h-screen px-6 text-center'>
				<div className='bg-background/40 backdrop-blur-lg border-border/30 rounded-lg p-8 max-w-md'>
					<h1 className='text-2xl font-bold text-white mb-4'>Please Log In</h1>
					<p className='text-white/80 mb-6'>You need to be logged in to view this page.</p>
					<Button asChild>
						<Link to='/login'>Go to Login</Link>
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className='flex flex-col items-center justify-center min-h-screen px-6 text-center'>
			<div className='bg-background/40 backdrop-blur-lg border-border/30 rounded-lg p-8 max-w-md'>
				<div className='text-yellow-400 text-6xl mb-4'>⚠</div>
				<h1 className='text-2xl font-bold text-white mb-4'>Payment Cancelled</h1>
				<p className='text-white/80 mb-6'>
					Your payment was cancelled. No charges have been made to your account.
				</p>
				<div className='flex flex-col sm:flex-row gap-3'>
					<Button asChild>
						<Link to='/calculator'>View Pricing Plans</Link>
					</Button>
					<Button
						asChild
						variant='outline'
						className='border-white/20 text-white hover:bg-white/10'
					>
						<Link to='/media'>Back to Media Library</Link>
					</Button>
				</div>
			</div>
		</div>
	);
};

// Media Dashboard Component
const MediaDashboard: React.FC = () => {
	const { user } = useAuth();
	const { media, isLoading, deleteMedia, fetchMedia } = useMedia();

	// Fetch user's media when component mounts
	React.useEffect(() => {
		if (user) {
			fetchMedia();
		}
	}, [user]); // Remove fetchMedia dependency to prevent infinite re-renders

	return (
		<div className='flex flex-col min-h-[calc(100vh-160px)] px-6 py-8'>
			{/* Header */}
			<div className='text-center mb-8'>
				<h1 className='text-3xl font-bold text white mb-2'>Media Library</h1>
				<p className='text-base text-white/80'>Manage and view your uploaded media files</p>
			</div>

			{/* Storage Usage */}
			<div className='mb-8 max-w-2xl mx-auto'>
				<StorageUsage
					compact={true}
					showUploadButton={true}
				/>
			</div>

			{/* Media Grid */}
			<div className='flex-1'>
				<MediaGrid
					media={media}
					isLoading={isLoading}
					onDelete={deleteMedia}
					emptyMessage='No media found. Start by uploading some files!'
				/>
			</div>
		</div>
	);
};

// Room Management Component
const RoomManagement: React.FC = () => {
	const { createRoom, isLoading, error, clearError } = useRooms();
	const navigate = useNavigate();

	const handleCreateRoom = async (isPrivate: boolean) => {
		const result = await createRoom(isPrivate);
		if (result.success && result.roomCode) {
			// Redirect to the room page
			console.log('Creating room successful, navigating to:', `/room/${result.roomCode}`);
			navigate(`/room/${result.roomCode}`);
		} else {
			alert(result.error || 'Failed to create room');
		}
	};

	return (
		<div className='flex flex-col min-h-[calc(100vh-160px)] px-6 py-8'>
			{/* Header */}
			<div className='text-center mb-8'>
				<h1 className='text-3xl font-bold text-white mb-2'>Room Management</h1>
				<p className='text-base text-white/80'>Create and manage your streaming rooms</p>
			</div>

			{/* Error Display */}
			{error && (
				<div className='mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg'>
					<div className='flex items-center justify-between'>
						<p className='text-red-400'>{error}</p>
						<Button
							onClick={clearError}
							variant='outline'
							size='sm'
							className='border-red-500/50 text-red-400 hover:bg-red-500/10'
						>
							×
						</Button>
					</div>
				</div>
			)}

			<div className='max-w-2xl mx-auto space-y-8'>
				{/* Create New Room */}
				<div className='bg-background/40 backdrop-blur-lg border-border/30 rounded-lg p-6'>
					<h2 className='text-xl font-semibold text-white mb-4'>Create New Room</h2>
					<div className='flex flex-col sm:flex-row gap-4'>
						<Button
							onClick={() => handleCreateRoom(false)}
							disabled={isLoading}
							className='flex-1 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed'
						>
							{isLoading ? 'Creating...' : 'Create Public Room'}
						</Button>
						<Button
							onClick={() => handleCreateRoom(true)}
							disabled={isLoading}
							variant='outline'
							className='flex-1 border-white/20 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed'
						>
							{isLoading ? 'Creating...' : 'Create Private Room'}
						</Button>
					</div>
				</div>

				{/* Your Rooms */}
				<div className='bg-background/40 backdrop-blur-lg border-border/30 rounded-lg p-6'>
					<h2 className='text-xl font-semibold text-white mb-4'>Your Rooms</h2>
					<div className='text-center py-8'>
						<p className='text-white/80'>
							No rooms created yet. Create your first room to get started!
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

// Join Room Component
const JoinRoom: React.FC = () => {
	const { publicRooms, fetchPublicRooms, isLoading, error, clearError } = useRooms();
	const [roomCode, setRoomCode] = useState('');
	const navigate = useNavigate();

	// Fetch public rooms on component mount
	React.useEffect(() => {
		fetchPublicRooms();
	}, [fetchPublicRooms]);

	const handleJoinRoom = () => {
		if (roomCode.length === 8) {
			// Redirect to the room page
			console.log('Joining room, navigating to:', `/room/${roomCode}`);
			navigate(`/room/${roomCode}`);
		} else {
			alert('Please enter a valid 8-character room code');
		}
	};

	return (
		<div className='flex flex-col min-h-[calc(100vh-160px)] px-6 py-8'>
			{/* Header */}
			<div className='text-center mb-8'>
				<h1 className='text-3xl font-bold text-white mb-2'>Join a Room</h1>
				<p className='text-base text-white/80'>
					Enter a room code to join an existing streaming session
				</p>
			</div>

			{/* Error Display */}
			{error && (
				<div className='mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg'>
					<div className='flex items-center justify-between'>
						<p className='text-red-400'>{error}</p>
						<Button
							onClick={clearError}
							variant='outline'
							size='sm'
							className='border-red-500/50 text-red-400 hover:bg-red-500/10'
						>
							×
						</Button>
					</div>
				</div>
			)}

			<div className='max-w-2xl mx-auto space-y-8'>
				{/* Join by Room Code */}
				<div className='bg-background/40 backdrop-blur-lg border-border/30 rounded-lg p-6'>
					<h2 className='text-xl font-semibold text-white mb-4'>Join by Room Code</h2>
					<div className='flex gap-3'>
						<input
							type='text'
							placeholder='Enter 8-character room code'
							maxLength={8}
							value={roomCode}
							onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
							className='flex-1 px-4 py-2 bg-background/60 border border-border/50 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
						/>
						<Button
							onClick={handleJoinRoom}
							disabled={roomCode.length !== 8}
							className='px-6 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed'
						>
							Join Room
						</Button>
					</div>
				</div>

				{/* Public Rooms */}
				<div className='bg-background/40 backdrop-blur-lg border-border/30 rounded-lg p-6'>
					<h2 className='text-xl font-semibold text-white mb-4'>Public Rooms</h2>
					<div>
						{isLoading ? (
							<div className='flex items-center justify-center py-8'>
								<div className='text-white/80'>Loading public rooms...</div>
							</div>
						) : publicRooms.length > 0 ? (
							<div className='grid gap-4'>
								{publicRooms.map((room) => (
									<div
										key={room.id}
										className='p-4 bg-background/60 border border-border/50 rounded-lg hover:bg-background/80 transition-colors'
									>
										<div className='flex items-center justify-between'>
											<div>
												<h3 className='text-white font-medium'>Room Code: {room.roomCode}</h3>
												<p className='text-white/60 text-sm'>
													Created: {new Date(room.createdAt).toLocaleDateString()}
												</p>
											</div>
											<Button
												onClick={() => setRoomCode(room.roomCode)}
												variant='outline'
												className='border-white/20 text-white hover:bg-white/10'
											>
												Use This Code
											</Button>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className='text-center py-8'>
								<p className='text-white/80'>No public rooms available</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

// Upload Page Component
const UploadPage: React.FC = () => {
	const { uploadMedia } = useMedia();

	const handleUpload = async (file: File, title: string) => {
		try {
			const result = await uploadMedia(file, title);
			if (result) {
				console.log('Upload successful!');
				// Could add success notification here
			} else {
				console.log('Upload failed - check error state');
				// Error is already set in the useMedia hook
			}
		} catch (error) {
			console.error('Unexpected upload error:', error);
		}
	};

	return (
		<div className='flex flex-col items-center justify-center min-h-[calc(100vh-160px)] px-6'>
			<div className='w-full max-w-md'>
				<div className='text-center mb-8'>
					<h1 className='text-3xl font-bold text-white mb-2'>Upload Media</h1>
					<p className='text-base text-white/80'>
						Share your audio and video files with the community
					</p>
				</div>

				<div className='bg-background/40 backdrop-blur-lg border-border/30 rounded-lg p-6'>
					<MediaUpload onUpload={handleUpload} />
				</div>
			</div>
		</div>
	);
};
