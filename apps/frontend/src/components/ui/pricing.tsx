import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'react-feather';
import { Link } from 'react-router-dom';

interface PricingTier {
	name: string;
	price: string;
	storage: string;
	features: string[];
	highlighted?: boolean;
	hasAds?: boolean;
	buttonText: string;
	buttonLink: string;
}

const pricingTiers: PricingTier[] = [
	{
		name: 'Free',
		price: '$0',
		storage: '5GB',
		features: [
			'Basic streaming quality',
			'Up to 4 viewers per room',
			'Standard chat features',
			'Community support',
		],
		hasAds: true,
		buttonText: 'Get Started',
		buttonLink: '/register',
	},
	{
		name: 'Pro',
		price: '$9.99',
		storage: '100GB',
		features: [
			'HD streaming quality',
			'Up to 20 viewers per room',
			'Advanced chat features',
			'Priority support',
			'Custom room themes',
		],
		buttonText: 'Choose Pro',
		buttonLink: '/register',
	},
	{
		name: 'Premium',
		price: '$19.99',
		storage: '500GB',
		features: [
			'4K streaming quality',
			'Unlimited viewers',
			'All chat features',
			'24/7 premium support',
			'Custom branding',
			'Analytics dashboard',
		],
		highlighted: true,
		buttonText: 'Choose Premium',
		buttonLink: '/register',
	},
	{
		name: 'Enterprise',
		price: 'Custom',
		storage: 'Unlimited',
		features: [
			'Custom streaming quality',
			'Unlimited everything',
			'Dedicated support',
			'White-label solution',
			'API access',
			'Custom integrations',
		],
		buttonText: 'Contact Sales',
		buttonLink: '/contact',
	},
];

export const Pricing = () => {
	return (
		<section className='py-16 px-6 bg-background/50'>
			<div className='max-w-7xl mx-auto'>
				<div className='text-center mb-12'>
					<h2 className='text-4xl font-bold text-white mb-4'>Choose Your Plan</h2>
					<p className='text-white/80 text-lg max-w-2xl mx-auto'>
						Start free and scale as you grow. All plans include our core features with no hidden
						fees.
					</p>
				</div>

				<div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12'>
					{pricingTiers.map((tier) => (
						<Card
							key={tier.name}
							className={`bg-background/40 backdrop-blur-lg border-border/30 ${
								tier.highlighted ? 'border-primary/50 ring-2 ring-primary/20' : ''
							}`}
						>
							<CardHeader className='text-center pb-4'>
								{tier.highlighted && (
									<div className='bg-primary/20 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-2 inline-block'>
										Most Popular
									</div>
								)}
								<CardTitle className='text-2xl font-bold text-white'>{tier.name}</CardTitle>
								<div className='mt-4'>
									<span className='text-4xl font-bold text-white'>{tier.price}</span>
									{tier.price !== 'Custom' && <span className='text-white/60'>/month</span>}
								</div>
								<CardDescription className='text-primary font-medium'>
									{tier.storage} Storage
								</CardDescription>
								{tier.hasAds && (
									<div className='text-yellow-500 text-sm font-medium'>Includes Ads</div>
								)}
							</CardHeader>
							<CardContent className='pt-0'>
								<ul className='space-y-3 mb-6'>
									{tier.features.map((feature, index) => (
										<li
											key={index}
											className='flex items-start gap-2'
										>
											<span className='text-primary text-sm mt-1'>✓</span>
											<span className='text-white/80 text-sm'>{feature}</span>
										</li>
									))}
								</ul>
								<Button
									asChild
									className={`w-full ${
										tier.highlighted
											? 'bg-primary hover:bg-primary/90 text-primary-foreground'
											: 'bg-background/60 hover:bg-background/80 text-white border border-border'
									}`}
								>
									<Link to={tier.buttonLink}>{tier.buttonText}</Link>
								</Button>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Storage Calculator Link */}
				<div className='text-center'>
					<Card className='bg-background/40 backdrop-blur-lg border-border/30 max-w-md mx-auto'>
						<CardContent className='p-6'>
							<div className='text-center'>
								<h3 className='text-xl font-semibold text-white mb-2'>Need More Storage?</h3>
								<p className='text-white/70 text-sm mb-4'>
									Calculate your exact storage needs with our interactive calculator
								</p>
								<Button
									asChild
									variant='outline'
									className='border-primary text-primary hover:bg-primary hover:text-primary-foreground'
								>
									<Link
										to='/calculator'
										className='flex items-center gap-2'
									>
										<Settings className='w-4 h-4' />
										Storage Calculator
									</Link>
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</section>
	);
};
