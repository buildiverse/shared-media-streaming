// AppRoutes Component

import React, { useState } from 'react';
import {
	Link,
	Navigate,
	Route,
	BrowserRouter as Router,
	Routes,
	useNavigate,
} from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { RegisterPage } from '../../features/auth/pages/RegisterPage';
import { MediaUpload } from '../../features/media/components/MediaUpload';
import { useMedia } from '../../features/media/hooks/useMedia';
import { useRooms } from '../../features/rooms/hooks/useRooms';
import { Button } from '../../ui/atoms/Button';
import { MediaGrid } from '../../ui/organisms/MediaGrid';
import { HomePage } from '../../ui/pages/HomePage';
import { RoomPage } from '../../ui/pages/RoomPage';
import { DashboardLayout } from '../../ui/templates/DashboardLayout';

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
				element={<HomePage user={user} />}
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
		<div className='dashboard-page'>
			<h1>Welcome Home, {user?.username}!</h1>
			<p>Your media streaming dashboard</p>

			<div>
				<h2>Quick Actions</h2>
				<div>
					<Link to='/upload'>
						<Button>Upload Media</Button>
					</Link>
					<Link to='/media'>
						<Button>View Media</Button>
					</Link>
				</div>
			</div>

			<div>
				<h2>Room Management</h2>
				<div>
					<Link to='/rooms'>
						<Button>Manage Rooms</Button>
					</Link>
					<Link to='/join-room'>
						<Button>Join Room</Button>
					</Link>
				</div>
			</div>
		</div>
	);
};

// Media Dashboard Component
const MediaDashboard: React.FC = () => {
	const { media, isLoading, deleteMedia } = useMedia();

	return (
		<div className='media-page'>
			<h1>Media Library</h1>
			<MediaGrid
				media={media}
				isLoading={isLoading}
				onDelete={deleteMedia}
				emptyMessage='No media found. Start by uploading some files!'
			/>
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
		<div className='room-management-page'>
			<h1>Room Management</h1>
			<p>Create and manage your streaming rooms</p>

			{error && (
				<div style={{ color: 'red', marginBottom: '20px' }}>
					{error}
					<button
						onClick={clearError}
						style={{ marginLeft: '10px' }}
					>
						×
					</button>
				</div>
			)}

			<div>
				<h2>Create New Room</h2>
				<div>
					<Button
						onClick={() => handleCreateRoom(false)}
						disabled={isLoading}
					>
						{isLoading ? 'Creating...' : 'Create Public Room'}
					</Button>
					<Button
						onClick={() => handleCreateRoom(true)}
						disabled={isLoading}
					>
						{isLoading ? 'Creating...' : 'Create Private Room'}
					</Button>
				</div>
			</div>

			<div>
				<h2>Your Rooms</h2>
				<div>
					<p>No rooms created yet. Create your first room to get started!</p>
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
		<div className='join-room-page'>
			<h1>Join a Room</h1>
			<p>Enter a room code to join an existing streaming session</p>

			{error && (
				<div style={{ color: 'red', marginBottom: '20px' }}>
					{error}
					<button
						onClick={clearError}
						style={{ marginLeft: '10px' }}
					>
						×
					</button>
				</div>
			)}

			<div>
				<h2>Join by Room Code</h2>
				<div>
					<input
						type='text'
						placeholder='Enter 8-character room code'
						maxLength={8}
						value={roomCode}
						onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
						style={{ padding: '8px', marginRight: '10px', fontSize: '16px' }}
					/>
					<Button
						onClick={handleJoinRoom}
						disabled={roomCode.length !== 8}
					>
						Join Room
					</Button>
				</div>
			</div>

			<div>
				<h2>Public Rooms</h2>
				<div>
					{isLoading ? (
						<p>Loading public rooms...</p>
					) : publicRooms.length > 0 ? (
						<div>
							{publicRooms.map((room) => (
								<div
									key={room.id}
									style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ccc' }}
								>
									<strong>Room Code: {room.roomCode}</strong>
									<p>Created: {new Date(room.createdAt).toLocaleDateString()}</p>
									<Button onClick={() => setRoomCode(room.roomCode)}>Use This Code</Button>
								</div>
							))}
						</div>
					) : (
						<p>No public rooms available</p>
					)}
				</div>
			</div>
		</div>
	);
};

// Upload Page Component
const UploadPage: React.FC = () => {
	const { uploadMedia, uploading, error } = useMedia();

	const handleUpload = async (file: File, title: string, description?: string) => {
		try {
			const result = await uploadMedia(file, title, description);
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
		<div className='upload-page'>
			<h1>Upload Media</h1>
			<MediaUpload onUpload={handleUpload} />
			{uploading && <p>Uploading...</p>}
			{error && <p style={{ color: 'red' }}>Error: {error}</p>}
		</div>
	);
};
