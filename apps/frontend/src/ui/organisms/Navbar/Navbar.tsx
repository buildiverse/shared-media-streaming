// Navbar Organism Component

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User } from '../../../types';
import { Button } from '../../atoms/Button';

export interface NavbarProps {
	user: User | null;
	onLogout: () => void;
	className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout, className = '' }) => {
	const location = useLocation();

	const navbarClasses = ['navbar', className].filter(Boolean).join(' ');

	const isActive = (path: string) => location.pathname === path;

	return (
		<nav
			className={navbarClasses}
			role='navigation'
			aria-label='Main navigation'
		>
			<div className='navbar__container'>
				<div className='navbar__brand'>
					<Link
						to='/'
						className='navbar__logo'
					>
						Shared Media
					</Link>
				</div>

				<div className='navbar__navigation'>
					<ul className='navbar__nav-list'>
						<li className='navbar__nav-item'>
							<Link
								to='/'
								className={`navbar__nav-link ${isActive('/') ? 'navbar__nav-link--active' : ''}`}
								aria-current={isActive('/') ? 'page' : undefined}
							>
								Home
							</Link>
						</li>
						<li className='navbar__nav-item'>
							<Link
								to='/media'
								className={`navbar__nav-link ${isActive('/media') ? 'navbar__nav-link--active' : ''}`}
								aria-current={isActive('/media') ? 'page' : undefined}
							>
								Media
							</Link>
						</li>
						{user && (
							<>
								<li className='navbar__nav-item'>
									<Link
										to='/rooms'
										className={`navbar__nav-link ${isActive('/rooms') ? 'navbar__nav-link--active' : ''}`}
										aria-current={isActive('/rooms') ? 'page' : undefined}
									>
										Rooms
									</Link>
								</li>
								<li className='navbar__nav-item'>
									<Link
										to='/upload'
										className={`navbar__nav-link ${isActive('/upload') ? 'navbar__nav-link--active' : ''}`}
										aria-current={isActive('/upload') ? 'page' : undefined}
									>
										Upload
									</Link>
								</li>
							</>
						)}
					</ul>
				</div>

				<div className='navbar__user'>
					{user ? (
						<div className='navbar__user-menu'>
							<span className='navbar__username'>Welcome, {user.username}</span>
							<Button
								variant='ghost'
								size='small'
								onClick={onLogout}
								aria-label='Logout'
							>
								Logout
							</Button>
						</div>
					) : (
						<div className='navbar__auth'>
							<Link to='/login'>
								<Button
									variant='secondary'
									size='small'
								>
									Login
								</Button>
							</Link>
							<Link to='/register'>
								<Button
									variant='primary'
									size='small'
								>
									Register
								</Button>
							</Link>
						</div>
					)}
				</div>
			</div>
		</nav>
	);
};
