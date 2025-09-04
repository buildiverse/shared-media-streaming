import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/ui/navbar';
import { Pricing } from '@/components/ui/pricing';
import { VideoShowcase } from '@/components/ui/video-showcase';
import { useRoomManagement } from '../use-cases/roomManagement';

export function Entry() {
	const { createRoom, isCreating } = useRoomManagement();

	const handleLaunchRoom = () => {
		createRoom();
	};

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
			<div className='relative z-10 flex flex-col items-center justify-center min-h-[calc(70vh-80px)] px-6 text-center'>
				{/* Headline */}
				<div className='mb-8'>
					<h1 className='text-4xl font-bold mb-3 tracking-tight'>
						<span className='text-white'>Watch</span> <span className='text-primary'>Together</span>
					</h1>
					<p className='text-xl font-semibold text-white/90'>Experience More</p>
				</div>

				{/* Description */}
				<p className='text-base text-white/80 max-w-xl mb-8 leading-relaxed'>
					Join friends in synchronised viewing experiences. Share movies, shows, and videos in
					real-time with seamless chat integration and crystal-clear quality.
				</p>

				{/* Single Primary CTA */}
				<div className='mb-4'>
					<Button
						onClick={handleLaunchRoom}
						disabled={isCreating}
						size='default'
						className='px-6'
					>
						{isCreating ? 'Creating Room...' : 'Launch Room'}
					</Button>
				</div>
			</div>

			{/* Footer */}
			<div className='relative z-10 text-center pb-6'>
				<p className='text-white/60 text-sm'>Developed by Buildiverse</p>
			</div>

			{/* Video Showcase Section */}
			<div className='relative z-20'>
				<VideoShowcase />
			</div>

			{/* Pricing Section */}
			<div className='relative z-20'>
				<Pricing />
			</div>
		</div>
	);
}
