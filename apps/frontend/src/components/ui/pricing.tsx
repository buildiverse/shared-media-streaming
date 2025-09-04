import { BillingSlider } from '@/components/ui/billing-slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'react-feather';
import { Link } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { usePricing } from '../../contexts/PricingContext';
import { useStorage } from '../../hooks/useStorage';
import { useStorageUpgrade } from '../../use-cases/storageUpgrade';
import { formatPrice } from '../../utils/locale';

export const Pricing = () => {
	const { currency, billingCycle, setBillingCycle } = usePricing();
	const { pricingData, isLoading } = useStorage();
	const { isAuthenticated } = useAuth();
	const { upgradeStorage, isUpgrading } = useStorageUpgrade();

	// Show loading state while pricing data is being fetched
	if (isLoading || !pricingData || !pricingData.tiers || pricingData.tiers.length === 0) {
		return (
			<section className='py-16 px-6 bg-background/50'>
				<div className='max-w-7xl mx-auto'>
					<div className='text-center'>
						<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4'></div>
						<p className='text-muted-foreground'>Loading pricing information...</p>
					</div>
				</div>
			</section>
		);
	}

	return (
		<section className='py-16 px-6 bg-background/50'>
			<div className='max-w-7xl mx-auto'>
				<div className='text-center mb-12'>
					<h2 className='text-4xl font-bold text-white mb-4'>Choose Your Plan</h2>
					<p className='text-white/80 text-lg max-w-2xl mx-auto'>
						Start free and scale as you grow. All plans include our core features with no hidden
						fees.
					</p>

					{/* Billing Cycle Selector */}
					<div className='flex justify-center mt-6'>
						<div className='flex items-center gap-4'>
							<label className='text-white text-sm font-medium'>Billing Cycle:</label>
							<BillingSlider
								value={billingCycle}
								onChange={setBillingCycle}
							/>
						</div>
					</div>
				</div>

				<div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12'>
					{pricingData.tiers.map((tier) => {
						const pricing = tier.pricing[currency];
						const price = billingCycle === 'monthly' ? pricing.monthly : pricing.yearly;
						const isFree = price === 0;

						return (
							<Card
								key={tier.id}
								className={`bg-background/40 backdrop-blur-lg border-border/30 ${
									tier.popular ? 'border-primary/50 ring-2 ring-primary/20' : ''
								}`}
							>
								<CardHeader className='text-center pb-4'>
									{tier.popular && (
										<div className='bg-primary/20 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-2 inline-block'>
											Most Popular
										</div>
									)}
									<CardTitle className='text-2xl font-bold text-white'>{tier.name}</CardTitle>
									<div className='mt-4'>
										<span className='text-4xl font-bold text-white'>
											{isFree ? 'Free' : formatPrice(price, currency)}
										</span>
										{!isFree && (
											<span className='text-white/60'>
												/{billingCycle === 'monthly' ? 'month' : 'year'}
											</span>
										)}
									</div>
									<CardDescription className='text-primary font-medium'>
										{tier.storageGB}GB Storage
									</CardDescription>
									{tier.name === 'Free' && (
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
										onClick={() => {
											console.log('Pricing button clicked:', {
												tierId: tier.id,
												currency,
												billingCycle,
												isFree,
												isAuthenticated,
											});
											if (isFree) {
												console.log('Free tier, redirecting to register');
												// For free tier, just redirect to register
												window.location.href = '/register';
											} else {
												console.log('Paid tier, calling upgradeStorage');
												// For paid tiers, use the storage upgrade hook
												upgradeStorage({
													tierId: tier.id,
													currency: currency,
													billingCycle: billingCycle,
												});
											}
										}}
										disabled={isUpgrading}
										className={`w-full ${
											tier.popular
												? 'bg-primary hover:bg-primary/90 text-primary-foreground'
												: 'bg-background/60 hover:bg-background/80 text-white border border-border'
										}`}
									>
										{isUpgrading ? 'Processing...' : isFree ? 'Get Started' : `Choose ${tier.name}`}
									</Button>
								</CardContent>
							</Card>
						);
					})}
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
