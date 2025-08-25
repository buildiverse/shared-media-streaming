// DashboardLayout Template Component

import React from 'react';
import { Outlet } from 'react-router-dom';
import { User } from '../../../types';
import { Navbar } from '../../organisms/Navbar';

export interface DashboardLayoutProps {
	user: User;
	onLogout: () => void;
	children?: React.ReactNode;
	className?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
	user,
	onLogout,
	children,
	className = '',
}) => {
	const layoutClasses = ['dashboard-layout', className].filter(Boolean).join(' ');

	return (
		<div className={layoutClasses}>
			<header className='dashboard-layout__header'>
				<Navbar
					user={user}
					onLogout={onLogout}
				/>
			</header>

			<main
				className='dashboard-layout__main'
				role='main'
			>
				<div className='dashboard-layout__container'>{children || <Outlet />}</div>
			</main>

			<footer className='dashboard-layout__footer'>
				<div className='dashboard-layout__footer-content'>
					<p>&copy; 2024 Shared Media Streaming. All rights reserved.</p>
				</div>
			</footer>
		</div>
	);
};
