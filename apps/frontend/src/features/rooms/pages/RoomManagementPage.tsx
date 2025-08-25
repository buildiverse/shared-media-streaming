import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../../../types';
import { Button } from '../../../ui/atoms/Button';
import { FormField } from '../../../ui/molecules/FormField';
import { DashboardLayout } from '../../../ui/templates/DashboardLayout';

interface RoomManagementPageProps {
	user: User;
	onLogout: () => void;
}

export const RoomManagementPage: React.FC<RoomManagementPageProps> = ({ user, onLogout }) => {
	const navigate = useNavigate();
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [showJoinForm, setShowJoinForm] = useState(false);
	const [roomName, setRoomName] = useState('');
	const [roomDescription, setRoomDescription] = useState('');
	const [isPrivate, setIsPrivate] = useState(false);
	const [maxUsers, setMaxUsers] = useState(10);
	const [roomCode, setRoomCode] = useState('');

	const handleCreateRoom = () => {
		// TODO: Implement room creation
		console.log('Creating room:', {
			roomName,
			roomDescription,
			isPrivate,
			maxUsers,
		});
		// Navigate to the created room
		// navigate(`/room/${roomId}`);
	};

	const handleJoinRoom = () => {
		// TODO: Implement room joining
		console.log('Joining room:', roomCode);
		// Navigate to the joined room
		// navigate(`/room/${roomCode}`);
	};

	return (
		<DashboardLayout
			user={user}
			onLogout={onLogout}
		>
			<div>
				<h1>Room Management</h1>
				<p>Welcome, {user.username}! What would you like to do?</p>

				<div>
					{!showCreateForm && !showJoinForm && (
						<div>
							<div>
								<h2>Create a New Room</h2>
								<p>Start a new media streaming session and invite others to join.</p>
								<Button onClick={() => setShowCreateForm(true)}>Create Room</Button>
							</div>

							<div>
								<h2>Join an Existing Room</h2>
								<p>Enter a room code to join someone else's streaming session.</p>
								<Button onClick={() => setShowJoinForm(true)}>Join Room</Button>
							</div>
						</div>
					)}

					{showCreateForm && (
						<div>
							<h2>Create New Room</h2>
							<form
								onSubmit={(e) => {
									e.preventDefault();
									handleCreateRoom();
								}}
							>
								<FormField
									label='Room Name'
									name='roomName'
									value={roomName}
									onChange={setRoomName}
									placeholder='Enter room name'
									required
								/>

								<FormField
									label='Description (Optional)'
									name='roomDescription'
									value={roomDescription}
									onChange={setRoomDescription}
									placeholder='Enter room description'
								/>

								<div>
									<label>
										<input
											type='checkbox'
											checked={isPrivate}
											onChange={(e) => setIsPrivate(e.target.checked)}
										/>
										Private Room (only joinable with code)
									</label>
								</div>

								<FormField
									label='Max Users'
									name='maxUsers'
									value={maxUsers.toString()}
									onChange={(value) => setMaxUsers(parseInt(value) || 10)}
									placeholder='10'
									type='number'
									min='2'
									max='100'
								/>

								<div>
									<Button type='submit'>Create Room</Button>
									<Button onClick={() => setShowCreateForm(false)}>Cancel</Button>
								</div>
							</form>
						</div>
					)}

					{showJoinForm && (
						<div>
							<h2>Join Room</h2>
							<form
								onSubmit={(e) => {
									e.preventDefault();
									handleJoinRoom();
								}}
							>
								<FormField
									label='Room Code'
									name='roomCode'
									value={roomCode}
									onChange={setRoomCode}
									placeholder='Enter room code'
									required
								/>

								<div>
									<Button type='submit'>Join Room</Button>
									<Button onClick={() => setShowJoinForm(false)}>Cancel</Button>
								</div>
							</form>
						</div>
					)}
				</div>
			</div>
		</DashboardLayout>
	);
};
