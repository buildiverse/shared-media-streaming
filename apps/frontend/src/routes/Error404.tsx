import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/ui/navbar';
import { Link } from 'react-router-dom';

export function Error404() {
	return (
		<div className='min-h-screen bg-background relative overflow-hidden'>
			{/* Animated Background Shapes */}
			<div className='absolute inset-0 pointer-events-none'>
				{/* Large Circle */}
				<div
					className='absolute w-[1152px] h-[1152px] bg-primary/20 rounded-full'
					style={{
						top: '10%',
						left: '-10%',
						animation: 'floatCircle 20s ease-in-out infinite',
						filter: 'blur(60px)',
					}}
				></div>

				{/* First Oval */}
				<div
					className='absolute w-[960px] h-[720px] bg-primary/15 rounded-full'
					style={{
						top: '60%',
						right: '-5%',
						animation: 'floatOval1 25s ease-in-out infinite',
						filter: 'blur(45px)',
					}}
				></div>

				{/* Second Oval */}
				<div
					className='absolute w-[864px] h-[576px] bg-primary/25 rounded-full'
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
			<div className='relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6 text-center'>
				{/* 404 Content */}
				<div className='mb-8'>
					<h1 className='text-6xl font-bold text-white mb-4'>404</h1>
					<h2 className='text-2xl font-semibold text-white mb-4'>Page Not Found</h2>
					<p className='text-base text-white/80 max-w-md leading-relaxed'>
						The page you're looking for doesn't exist or has been moved.
					</p>
				</div>

				{/* Action Buttons */}
				<div className='flex flex-col sm:flex-row gap-4'>
					<Button
						asChild
						size='default'
						className='px-6'
					>
						<Link to='/splash'>Go Home</Link>
					</Button>
					<Button
						asChild
						variant='outline'
						size='default'
						className='px-6 border-white text-white hover:bg-white hover:text-background'
					>
						<Link to='/rooms'>Launch Room</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
