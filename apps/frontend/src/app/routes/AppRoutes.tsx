// AppRoutes Component

import React from 'react';
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
import { RoomManagementPage } from '../../features/rooms/pages/RoomManagementPage';
import { RoomPage } from '../../features/rooms/pages/RoomPage';
import { Button } from '../../ui/atoms/Button';
import { MediaGrid } from '../../ui/organisms/MediaGrid';
import { HomePage } from '../../ui/pages/HomePage';
import { DashboardLayout } from '../../ui/templates/DashboardLayout';

// Protected Route Component
interface ProtectedRouteProps {
	children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
	const { isAuthenticated } = useAuth();

	if (!isAuthenticated) {
		return (
			<Navigate
				to='/login'
				replace
			/>
		);
	}

	return <>{children}</>;
};

// Main AppRoutes Component
export const AppRoutes: React.FC = () => {
	const { user, logout } = useAuth();
	const { media, isLoading, error, deleteMedia } = useMedia();
	const navigate = useNavigate();

	const handleLogout = () => {
		logout();
	};

	return (
		<Router>
			<Routes>
				{/* Public routes */}
				<Route
					path='/'
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
					path='/dashboard'
					element={
						<ProtectedRoute>
							{user && (
								<DashboardLayout
									user={user}
									onLogout={handleLogout}
								>
									<div className='dashboard-page'>
										<h1>Dashboard</h1>
										<p>Welcome to your dashboard, {user.username}!</p>

										<div>
											<h2>Quick Actions</h2>
											<div>
												<Link to='/rooms'>
													<Button>Manage Rooms</Button>
												</Link>
												<Link to='/upload'>
													<Button>Upload Media</Button>
												</Link>
												<Link to='/media'>
													<Button>View Media</Button>
												</Link>
											</div>
										</div>

										<div>
											<h2>Public Rooms</h2>
											<p>Join these public rooms or create your own!</p>
											{/* TODO: Fetch and display public rooms from backend */}
											<div>
												<div>
													<h3>Sample Public Room 1</h3>
													<p>Code: ABC12345 • Users: 2/10</p>
													<Button onClick={() => navigate('/room/ABC12345')}>Join Room</Button>
												</div>
												<div>
													<h3>Sample Public Room 2</h3>
													<p>Code: DEF67890 • Users: 1/15</p>
													<Button onClick={() => navigate('/room/DEF67890')}>Join Room</Button>
												</div>
											</div>
										</div>
									</div>
								</DashboardLayout>
							)}
						</ProtectedRoute>
					}
				/>

				<Route
					path='/upload'
					element={
						<ProtectedRoute>
							{user && (
								<DashboardLayout
									user={user}
									onLogout={handleLogout}
								>
									<MediaUpload
										onUpload={async (file, title, description) => {
											// This will be implemented with the media service
											console.log('Upload:', { file, title, description });
										}}
									/>
								</DashboardLayout>
							)}
						</ProtectedRoute>
					}
				/>

				<Route
					path='/media'
					element={
						<ProtectedRoute>
							{user && (
								<DashboardLayout
									user={user}
									onLogout={handleLogout}
								>
									<div className='media-page'>
										<h1>Media Library</h1>
										<MediaGrid
											media={media}
											isLoading={isLoading}
											onDelete={deleteMedia}
											emptyMessage='No media found. Start by uploading some files!'
										/>
									</div>
								</DashboardLayout>
							)}
						</ProtectedRoute>
					}
				/>

				{/* Room routes */}
				<Route
					path='/rooms'
					element={
						<ProtectedRoute>
							{user && (
								<RoomManagementPage
									user={user}
									onLogout={handleLogout}
								/>
							)}
						</ProtectedRoute>
					}
				/>

				<Route
					path='/room/:roomId'
					element={
						<ProtectedRoute>
							{user && (
								<RoomPage
									user={user}
									onLogout={handleLogout}
								/>
							)}
						</ProtectedRoute>
					}
				/>

				{/* Catch all route */}
				<Route
					path='*'
					element={
						<Navigate
							to='/'
							replace
						/>
					}
				/>
			</Routes>
		</Router>
	);
};
