/**
 * Utility functions for locale and currency detection
 */

// Map of locale regions to currencies
const LOCALE_TO_CURRENCY: Record<string, string> = {
	// North America
	US: 'USD',
	CA: 'CAD',
	MX: 'USD', // Mexico typically uses USD for online services

	// Europe
	GB: 'GBP',
	IE: 'EUR',
	FR: 'EUR',
	DE: 'EUR',
	ES: 'EUR',
	IT: 'EUR',
	NL: 'EUR',
	BE: 'EUR',
	AT: 'EUR',
	PT: 'EUR',
	FI: 'EUR',
	GR: 'EUR',
	LU: 'EUR',
	MT: 'EUR',
	CY: 'EUR',
	SI: 'EUR',
	SK: 'EUR',
	EE: 'EUR',
	LV: 'EUR',
	LT: 'EUR',

	// Asia Pacific
	AU: 'AUD',
	NZ: 'AUD', // New Zealand often uses AUD for online services
	JP: 'USD', // Japan typically uses USD for international services
	KR: 'USD', // South Korea typically uses USD for international services
	SG: 'USD', // Singapore typically uses USD for international services
	HK: 'USD', // Hong Kong typically uses USD for international services
	IN: 'USD', // India typically uses USD for international services
	CN: 'USD', // China typically uses USD for international services

	// Default fallback
	DEFAULT: 'USD',
};

/**
 * Detect user's currency based on their locale
 * @returns The appropriate currency code (USD, EUR, GBP, CAD, AUD)
 */
export const detectUserCurrency = (): string => {
	try {
		// Get user's locale from browser
		const locale = navigator.language || navigator.languages?.[0] || 'en-US';

		// Extract country code from locale (e.g., 'en-US' -> 'US')
		const countryCode = locale.split('-')[1]?.toUpperCase();

		if (countryCode && LOCALE_TO_CURRENCY[countryCode]) {
			return LOCALE_TO_CURRENCY[countryCode];
		}

		// Fallback to default
		return LOCALE_TO_CURRENCY.DEFAULT;
	} catch (error) {
		console.warn('Failed to detect user currency:', error);
		return LOCALE_TO_CURRENCY.DEFAULT;
	}
};

/**
 * Get currency symbol for a given currency code
 * @param currency - Currency code (USD, EUR, etc.)
 * @returns Currency symbol
 */
export const getCurrencySymbol = (currency: string): string => {
	const symbols: Record<string, string> = {
		USD: '$',
		EUR: '€',
		GBP: '£',
		CAD: 'C$',
		AUD: 'A$',
	};

	return symbols[currency] || '$';
};

/**
 * Format price with appropriate currency symbol and locale
 * @param price - Price value
 * @param currency - Currency code
 * @returns Formatted price string
 */
export const formatPrice = (price: number, currency: string): string => {
	const symbol = getCurrencySymbol(currency);

	// Use Intl.NumberFormat for proper locale formatting
	try {
		const formatter = new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currency,
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		});

		return formatter.format(price);
	} catch (error) {
		// Fallback to simple formatting
		return `${symbol}${price.toFixed(2)}`;
	}
};
