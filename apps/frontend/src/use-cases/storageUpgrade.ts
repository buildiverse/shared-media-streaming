import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../app/providers/AuthProvider';
import { useToast } from '../providers/ToastProvider';
import { storageService } from '../services/storage';
import { useUserFlow } from './userFlow';

export interface StorageUpgradeOptions {
	tierId: string;
	currency?: string;
	billingCycle?: 'monthly' | 'yearly';
	redirectAfterUpgrade?: string;
}

export const useStorageUpgrade = () => {
	const [isUpgrading, setIsUpgrading] = useState(false);
	const navigate = useNavigate();
	const toast = useToast();
	const { isAuthenticated } = useAuth();
	const { handleStorageUpgrade } = useUserFlow();

	/**
	 * Initiate storage upgrade process
	 * @param options - Upgrade options
	 */
	const upgradeStorage = async (options: StorageUpgradeOptions) => {
		console.log('upgradeStorage called with:', { options, isAuthenticated });
		if (!isAuthenticated) {
			console.log('User not authenticated, calling handleStorageUpgrade');
			handleStorageUpgrade(options.tierId, options.currency, options.billingCycle);
			return;
		}

		console.log('User is authenticated, proceeding with checkout');
		setIsUpgrading(true);
		try {
			// Create checkout session
			console.log('Creating checkout session with:', options);
			const session = await storageService.createCheckoutSession(
				options.tierId,
				options.currency,
				options.billingCycle,
			);

			console.log('Checkout session created:', session);
			console.log('Session URL:', session.url);
			toast.success('Redirecting to checkout...');

			// Redirect to Stripe checkout
			if (session.url) {
				console.log('Redirecting to:', session.url);

				// Test if redirects work at all
				console.log('Testing redirect capability...');

				// Try immediate redirect
				setTimeout(() => {
					console.log('Attempting redirect after timeout...');
					window.location.href = session.url;
				}, 100);

				// Also try opening in new tab as backup
				setTimeout(() => {
					console.log('Opening in new tab as backup...');
					const newWindow = window.open(session.url, '_blank');
					if (!newWindow) {
						console.error('Popup blocked! User needs to allow popups for this site.');
						toast.error(
							'Popup blocked! Please allow popups for this site or click the link below.',
							{
								duration: 10000,
								action: {
									label: 'Open Checkout',
									onClick: () => {
										// Create a temporary link and click it
										const link = document.createElement('a');
										link.href = session.url;
										link.target = '_blank';
										link.click();
									},
								},
							},
						);
					}
				}, 200);
			} else {
				console.error('No URL in session object:', session);
				toast.error('Checkout session created but no redirect URL found');
			}
		} catch (error: any) {
			const errorMessage = error.response?.data?.message || 'Failed to initiate upgrade';
			toast.error(errorMessage);
			throw error;
		} finally {
			setIsUpgrading(false);
		}
	};

	/**
	 * Handle successful payment completion
	 * Called after returning from Stripe checkout
	 */
	const handleUpgradeSuccess = () => {
		toast.success('Storage upgrade completed successfully!');

		// Redirect to dashboard or specified page
		const redirectPath = sessionStorage.getItem('upgradeRedirect') || '/dashboard';
		sessionStorage.removeItem('upgradeRedirect');
		navigate(redirectPath);
	};

	/**
	 * Handle upgrade cancellation
	 * Called when user cancels the checkout process
	 */
	const handleUpgradeCancel = () => {
		toast.warning('Upgrade cancelled');
		navigate('/calculator');
	};

	/**
	 * Get recommended tier based on current usage
	 */
	const getRecommendedTier = async () => {
		try {
			const stats = await storageService.getStorageStats();
			const pricingData = await storageService.getPricingTiers();

			return storageService.getRecommendedTier(stats.currentUsage, pricingData.tiers);
		} catch (error) {
			console.error('Failed to get recommended tier:', error);
			return null;
		}
	};

	/**
	 * Check if user needs storage upgrade
	 */
	const needsStorageUpgrade = async (): Promise<boolean> => {
		try {
			const stats = await storageService.getStorageStats();
			return storageService.isStorageNearlyFull(stats.currentUsage, stats.maxLimit);
		} catch (error) {
			console.error('Failed to check storage status:', error);
			return false;
		}
	};

	/**
	 * Get storage usage warning message
	 */
	const getStorageWarningMessage = async (): Promise<string | null> => {
		try {
			const stats = await storageService.getStorageStats();
			const usagePercentage = storageService.getUsagePercentage(stats.currentUsage, stats.maxLimit);

			if (usagePercentage >= 90) {
				return `You're using ${usagePercentage.toFixed(1)}% of your storage. Consider upgrading to avoid upload limits.`;
			} else if (usagePercentage >= 75) {
				return `You're using ${usagePercentage.toFixed(1)}% of your storage.`;
			}

			return null;
		} catch (error) {
			console.error('Failed to get storage warning:', error);
			return null;
		}
	};

	/**
	 * Format storage size for display
	 */
	const formatStorageSize = (bytes: number): string => {
		return storageService.formatBytes(bytes);
	};

	return {
		upgradeStorage,
		handleUpgradeSuccess,
		handleUpgradeCancel,
		getRecommendedTier,
		needsStorageUpgrade,
		getStorageWarningMessage,
		formatStorageSize,
		isUpgrading,
	};
};
