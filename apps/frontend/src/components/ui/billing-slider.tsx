import React from 'react';

interface BillingSliderProps {
	value: 'monthly' | 'yearly';
	onChange: (value: 'monthly' | 'yearly') => void;
	className?: string;
}

export const BillingSlider: React.FC<BillingSliderProps> = ({
	value,
	onChange,
	className = '',
}) => {
	return (
		<div className={`flex items-center gap-2 ${className}`}>
			<span
				className={`text-sm transition-colors ${value === 'monthly' ? 'text-white' : 'text-white/60'}`}
			>
				Monthly
			</span>

			<div className='relative'>
				<button
					type='button'
					onClick={() => onChange(value === 'monthly' ? 'yearly' : 'monthly')}
					className={`
						relative inline-flex h-6 w-11 items-center rounded-full transition-colors
						${value === 'yearly' ? 'bg-primary' : 'bg-muted'}
						focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
					`}
					role='switch'
					aria-checked={value === 'yearly'}
					aria-label='Toggle billing cycle'
				>
					<span
						className={`
							inline-block h-4 w-4 transform rounded-full bg-white transition-transform
							${value === 'yearly' ? 'translate-x-6' : 'translate-x-1'}
						`}
					/>
				</button>
			</div>

			<span
				className={`text-sm transition-colors ${value === 'yearly' ? 'text-white' : 'text-white/60'}`}
			>
				Yearly
			</span>

			{value === 'yearly' && (
				<span className='text-xs text-green-400 font-medium ml-1'>Save 20%</span>
			)}
		</div>
	);
};
