// DashboardLayout Template Component

import { Navbar } from '@/components/ui/navbar';
import React from 'react';
import { Outlet } from 'react-router-dom';
import { User } from '../../../types';

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
	return (
		<div className='min-h-screen bg-background relative overflow-hidden'>
			{/* Animated Background Shapes */}
			<div className='absolute inset-0 pointer-events-none'>
				{/* Large Circle */}
				<div
					className='absolute w-96 h-96 bg-primary/20 rounded-full'
					style={{
						top: '10%',
						left: '-10%',
						animation: 'floatCircle 20s ease-in-out infinite',
						filter: 'blur(60px)',
					}}
				></div>

				{/* First Oval */}
				<div
					className='absolute w-80 h-60 bg-primary/15 rounded-full'
					style={{
						top: '60%',
						right: '-5%',
						animation: 'floatOval1 25s ease-in-out infinite',
						filter: 'blur(45px)',
					}}
				></div>

				{/* Second Oval */}
				<div
					className='absolute w-72 h-48 bg-primary/25 rounded-full'
					style={{
						bottom: '20%',
						left: '20%',
						animation: 'floatOval2 30s ease-in-out infinite',
						filter: 'blur(45px)',
					}}
				></div>
			</div>

			{/* Navigation */}
			<Navbar />

			{/* Main Content */}
			<div className='relative z-10 min-h-[calc(100vh-80px)]'>{children || <Outlet />}</div>

			{/* Footer */}
			<div className='relative z-10 text-center pb-6'>
				<p className='text-white/60 text-sm'>
					&copy; 2024 Shared Media Streaming. All rights reserved.
				</p>
			</div>
		</div>
	);
};
