// AuthLayout Template Component

import React from 'react';
import { Link } from 'react-router-dom';

export interface AuthLayoutProps {
	children: React.ReactNode;
	className?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, className = '' }) => {
	const layoutClasses = ['auth-layout', className].filter(Boolean).join(' ');

	return (
		<div className={layoutClasses}>
			<header className='auth-layout__header'>
				<div className='auth-layout__header-content'>
					<Link
						to='/'
						className='auth-layout__logo'
					>
						Shared Media
					</Link>
				</div>
			</header>

			<main
				className='auth-layout__main'
				role='main'
			>
				<div className='auth-layout__container'>{children}</div>
			</main>

			<footer className='auth-layout__footer'>
				<div className='auth-layout__footer-content'>
					<p>&copy; 2024 Shared Media Streaming. All rights reserved.</p>
				</div>
			</footer>
		</div>
	);
};
