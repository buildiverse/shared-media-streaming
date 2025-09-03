import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/ui/navbar';
import { Pricing } from '@/components/ui/pricing';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export function Calculator() {
	const [storage, setStorage] = useState(50);
	const [pricePerGB] = useState(0.1); // $0.10 per GB per month

	const calculatePrice = (gb: number) => {
		if (gb <= 5) return 0; // Free tier
		if (gb <= 100) return 9.99; // Pro tier
		if (gb <= 500) return 19.99; // Premium tier
		return gb * pricePerGB; // Enterprise pricing
	};

	const getTier = (gb: number) => {
		if (gb <= 5) return { name: 'Free', color: 'text-green-500' };
		if (gb <= 100) return { name: 'Pro', color: 'text-blue-500' };
		if (gb <= 500) return { name: 'Premium', color: 'text-primary' };
		return { name: 'Enterprise', color: 'text-purple-500' };
	};

	const price = calculatePrice(storage);
	const tier = getTier(storage);

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

			<Navbar />

			<div className='relative z-10 max-w-4xl mx-auto px-6 py-16'>
				<div className='text-center mb-12'>
					<h1 className='text-4xl font-bold text-white mb-4'>Storage Calculator</h1>
					<p className='text-white/80 text-lg max-w-2xl mx-auto'>
						Drag the slider to see how much storage you need and get an instant price quote
					</p>
				</div>

				<Card className='bg-background/40 backdrop-blur-lg border-border/30'>
					<CardHeader>
						<CardTitle className='text-2xl text-white text-center'>
							Calculate Your Storage Needs
						</CardTitle>
						<CardDescription className='text-center text-white/70'>
							Move the slider to adjust your storage requirements
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-8'>
						{/* Storage Slider */}
						<div className='space-y-4'>
							<div className='flex justify-between items-center'>
								<label className='text-white font-medium'>Storage: {storage} GB</label>
								<span className={`font-semibold ${tier.color}`}>{tier.name} Tier</span>
							</div>

							<input
								type='range'
								min='1'
								max='1000'
								value={storage}
								onChange={(e) => setStorage(Number(e.target.value))}
								className='w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider'
								style={{
									background: `linear-gradient(to right, #9685ff 0%, #9685ff ${(storage / 1000) * 100}%, #262626 ${(storage / 1000) * 100}%, #262626 100%)`,
								}}
							/>

							<div className='flex justify-between text-sm text-white/60'>
								<span>1 GB</span>
								<span>1000 GB</span>
							</div>
						</div>

						{/* Price Display */}
						<div className='text-center p-6 bg-background/60 rounded-lg border border-border/30'>
							<div className='text-4xl font-bold text-white mb-2'>${price.toFixed(2)}</div>
							<div className='text-white/70'>{price === 0 ? 'Free forever' : 'per month'}</div>
							{tier.name === 'Enterprise' && (
								<div className='text-primary text-sm mt-2'>
									Custom pricing available for enterprise needs
								</div>
							)}
						</div>

						{/* Storage Breakdown */}
						<div className='grid md:grid-cols-3 gap-4'>
							<div className='text-center p-4 bg-background/40 rounded-lg'>
								<div className='text-2xl font-bold text-white'>{storage}</div>
								<div className='text-white/70 text-sm'>GB Storage</div>
							</div>
							<div className='text-center p-4 bg-background/40 rounded-lg'>
								<div className='text-2xl font-bold text-white'>{Math.floor(storage)}</div>
								<div className='text-white/70 text-sm'>Hours of HD Video</div>
							</div>
							<div className='text-center p-4 bg-background/40 rounded-lg'>
								<div className='text-2xl font-bold text-white'>{Math.floor(storage * 1000)}</div>
								<div className='text-white/70 text-sm'>Songs</div>
							</div>
						</div>

						{/* Action Buttons */}
						<div className='flex flex-col sm:flex-row gap-4 justify-center'>
							<Button
								asChild
								className='bg-primary hover:bg-primary/90 text-primary-foreground'
							>
								<Link to='/register'>Get Started with {tier.name}</Link>
							</Button>
							<Button
								asChild
								variant='outline'
								className='border-white text-white hover:bg-white hover:text-background'
							>
								<Link to='/splash'>Back to Home</Link>
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Additional Info */}
				<div className='mt-12 grid md:grid-cols-2 gap-6'>
					<Card className='bg-background/40 backdrop-blur-lg border-border/30'>
						<CardContent className='p-6'>
							<h3 className='text-lg font-semibold text-white mb-3'>What's Included?</h3>
							<ul className='space-y-2 text-white/70 text-sm'>
								<li>• Unlimited streaming rooms</li>
								<li>• Real-time chat and reactions</li>
								<li>• Cross-platform compatibility</li>
								<li>• 24/7 customer support</li>
								<li>• Regular feature updates</li>
							</ul>
						</CardContent>
					</Card>

					<Card className='bg-background/40 backdrop-blur-lg border-border/30'>
						<CardContent className='p-6'>
							<h3 className='text-lg font-semibold text-white mb-3'>Storage Guidelines</h3>
							<ul className='space-y-2 text-white/70 text-sm'>
								<li>• 1GB ≈ 1 hour of HD video</li>
								<li>• 1GB ≈ 1000 songs (MP3)</li>
								<li>• 1GB ≈ 500 high-res photos</li>
								<li>• Automatic compression for efficiency</li>
								<li>• Easy upgrade/downgrade anytime</li>
							</ul>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Pricing Plans Section */}
			<div className='relative z-20'>
				<Pricing />
			</div>
		</div>
	);
}
