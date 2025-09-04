import { useEffect, useState } from 'react';
import { useAuth } from '../app/providers/AuthProvider';
import { usePricing } from '../contexts/PricingContext';
import { useToast } from '../providers/ToastProvider';
import { StoragePricingData, storageService, StorageStats, StorageTier } from '../services/storage';

export const useStorage = () => {
	const [stats, setStats] = useState<StorageStats | null>(null);
	const [pricingData, setPricingData] = useState<StoragePricingData | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const toast = useToast();
	const { isAuthenticated } = useAuth();
	const { currency } = usePricing();

	// Fetch storage statistics (only called when authenticated)
	const fetchStorageStats = async () => {
		setIsLoading(true);
		setError(null);

		try {
			const stats = await storageService.getStorageStats();
			setStats(stats);
		} catch (err: any) {
			const errorMessage = err.response?.data?.message || 'Failed to fetch storage statistics';
			setError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	// Fetch pricing tiers
	const fetchPricingTiers = async (currency?: string) => {
		setIsLoading(true);
		setError(null);

		try {
			const data = await storageService.getPricingTiers(currency);
			setPricingData(data);
		} catch (err: any) {
			const errorMessage = err.response?.data?.message || 'Failed to fetch pricing tiers';
			setError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	// Create checkout session
	const createCheckoutSession = async (
		tierId: string,
		currency?: string,
		billingCycle?: 'monthly' | 'yearly',
	) => {
		setIsLoading(true);
		setError(null);

		try {
			const session = await storageService.createCheckoutSession(tierId, currency, billingCycle);

			// Redirect to Stripe checkout
			window.location.href = session.url;

			toast.success('Redirecting to checkout...');
		} catch (err: any) {
			const errorMessage = err.response?.data?.message || 'Failed to create checkout session';
			setError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	// Get recommended tier
	const getRecommendedTier = (): StorageTier | null => {
		if (!stats || !pricingData) return null;
		return storageService.getRecommendedTier(stats.currentUsage, pricingData.tiers);
	};

	// Check if storage is nearly full
	const isStorageNearlyFull = (): boolean => {
		if (!stats) return false;
		return storageService.isStorageNearlyFull(stats.currentUsage, stats.maxLimit);
	};

	// Format bytes helper
	const formatBytes = (bytes: number): string => {
		return storageService.formatBytes(bytes);
	};

	// Get usage percentage
	const getUsagePercentage = (): number => {
		if (!stats) return 0;
		return storageService.getUsagePercentage(stats.currentUsage, stats.maxLimit);
	};

	// Load initial data
	useEffect(() => {
		// Always fetch pricing data (public) with detected currency
		fetchPricingTiers(currency);

		// Only fetch stats if user is authenticated
		if (isAuthenticated) {
			fetchStorageStats();
		} else {
			// Clear stats if user is not authenticated
			setStats(null);
		}
	}, [isAuthenticated, currency]);

	return {
		stats,
		pricingData,
		isLoading,
		error,
		fetchStorageStats,
		fetchPricingTiers,
		createCheckoutSession,
		getRecommendedTier,
		isStorageNearlyFull,
		formatBytes,
		getUsagePercentage,
	};
};
