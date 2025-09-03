import { Star } from 'react-feather';
import { Link } from 'react-router-dom';

export const Navbar = () => {
	return (
		<nav className='w-full px-6 py-6'>
			<div className='max-w-7xl mx-auto flex items-center justify-between'>
				{/* Logo */}
				<Link
					to='/'
					className='flex items-center gap-2'
				>
					<span className='text-xl font-bold text-white'>Shared</span>
					<Star className='w-5 h-5 text-white' />
					<span className='text-xl font-bold text-white'>Stream</span>
				</Link>

				{/* Center Navigation */}
				<div className='hidden md:flex items-center gap-6'>
					<Link
						to='/rooms'
						className='text-white hover:text-primary transition-colors'
					>
						Rooms
					</Link>
					<span className='text-white/50'>•</span>
					<Link
						to='/library'
						className='text-white hover:text-primary transition-colors'
					>
						Library
					</Link>
					<span className='text-white/50'>•</span>
					<Link
						to='/account'
						className='text-white hover:text-primary transition-colors'
					>
						Account
					</Link>
				</div>

				{/* Right Navigation */}
				<div className='flex items-center gap-6'>
					<Link
						to='/demo'
						className='text-white hover:text-primary transition-colors'
					>
						Demo
					</Link>
					<span className='text-white/50'>•</span>
					<Link
						to='/calculator'
						className='text-white hover:text-primary transition-colors'
					>
						Pricing
					</Link>
				</div>
			</div>
		</nav>
	);
};
