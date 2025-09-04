import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { detectUserCurrency } from '../utils/locale';

interface PricingContextType {
	currency: string;
	billingCycle: 'monthly' | 'yearly';
	setCurrency: (currency: string) => void;
	setBillingCycle: (cycle: 'monthly' | 'yearly') => void;
}

const PricingContext = createContext<PricingContextType | undefined>(undefined);

interface PricingProviderProps {
	children: ReactNode;
}

export const PricingProvider: React.FC<PricingProviderProps> = ({ children }) => {
	const [currency, setCurrency] = useState<string>('USD');
	const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

	// Auto-detect currency on mount
	useEffect(() => {
		const detectedCurrency = detectUserCurrency();
		setCurrency(detectedCurrency);
	}, []);

	const value: PricingContextType = {
		currency,
		billingCycle,
		setCurrency,
		setBillingCycle,
	};

	return <PricingContext.Provider value={value}>{children}</PricingContext.Provider>;
};

export const usePricing = (): PricingContextType => {
	const context = useContext(PricingContext);
	if (context === undefined) {
		throw new Error('usePricing must be used within a PricingProvider');
	}
	return context;
};
