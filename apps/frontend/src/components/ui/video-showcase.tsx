import { Card, CardContent } from '@/components/ui/card';
import { Film, MessageCircle, Play, Smartphone } from 'react-feather';

export const VideoShowcase = () => {
	return (
		<section className='py-16 px-6'>
			<div className='max-w-7xl mx-auto'>
				{/* Desktop Video */}
				<div className='hidden md:block mb-8'>
					<Card className='bg-background/40 backdrop-blur-lg border-border/30 overflow-hidden'>
						<CardContent className='p-0'>
							<div className='aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center'>
								<div className='text-center'>
									<div className='w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-4 mx-auto'>
										<Play className='w-8 h-8 text-primary' />
									</div>
									<h3 className='text-xl font-semibold text-white mb-2'>Desktop Experience</h3>
									<p className='text-white/70'>
										Full-featured interface with chat, controls, and HD streaming
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Mobile Video */}
				<div className='md:hidden mb-8'>
					<Card className='bg-background/40 backdrop-blur-lg border-border/30 overflow-hidden'>
						<CardContent className='p-0'>
							<div className='aspect-[9/16] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center'>
								<div className='text-center'>
									<div className='w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 mx-auto'>
										<Play className='w-6 h-6 text-primary' />
									</div>
									<h3 className='text-lg font-semibold text-white mb-2'>Mobile Experience</h3>
									<p className='text-white/70 text-sm px-4'>
										Optimized for touch with simplified controls and mobile-friendly chat
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Features Grid */}
				<div className='grid md:grid-cols-3 gap-6'>
					<Card className='bg-background/40 backdrop-blur-lg border-border/30'>
						<CardContent className='p-6 text-center'>
							<div className='w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4 mx-auto'>
								<Film className='w-6 h-6 text-primary' />
							</div>
							<h3 className='text-lg font-semibold text-white mb-2'>Synchronized Playback</h3>
							<p className='text-white/70 text-sm'>
								Perfect sync across all devices with automatic buffering and lag compensation
							</p>
						</CardContent>
					</Card>

					<Card className='bg-background/40 backdrop-blur-lg border-border/30'>
						<CardContent className='p-6 text-center'>
							<div className='w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4 mx-auto'>
								<MessageCircle className='w-6 h-6 text-primary' />
							</div>
							<h3 className='text-lg font-semibold text-white mb-2'>Real-time Chat</h3>
							<p className='text-white/70 text-sm'>
								Share reactions and discuss content without interrupting the viewing experience
							</p>
						</CardContent>
					</Card>

					<Card className='bg-background/40 backdrop-blur-lg border-border/30'>
						<CardContent className='p-6 text-center'>
							<div className='w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4 mx-auto'>
								<Smartphone className='w-6 h-6 text-primary' />
							</div>
							<h3 className='text-lg font-semibold text-white mb-2'>Cross-Platform</h3>
							<p className='text-white/70 text-sm'>
								Works seamlessly on desktop, mobile, and tablet with responsive design
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</section>
	);
};
