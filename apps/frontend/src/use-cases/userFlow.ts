import { useNavigate } from 'react-router-dom';
import { useAuth } from '../app/providers/AuthProvider';
import { useToast } from '../providers/ToastProvider';

export interface UserFlowOptions {
	redirectAfterAuth?: string;
	showToast?: boolean;
	toastMessage?: string;
}

export const useUserFlow = () => {
	const navigate = useNavigate();
	const { user, isAuthenticated } = useAuth();
	const toast = useToast();

	/**
	 * Handle user registration flow
	 * @param credentials - Registration credentials
	 * @param options - Flow options
	 */
	const handleRegister = async (_options: UserFlowOptions = {}) => {
		try {
			// This would typically call the auth service
			// For now, we'll just navigate to the appropriate page
			const redirectPath = _options.redirectAfterAuth || '/dashboard';

			if (_options.showToast && _options.toastMessage) {
				toast.success(_options.toastMessage);
			}

			// Navigate to the intended destination
			navigate(redirectPath);
		} catch (error) {
			toast.error('Registration failed. Please try again.');
			throw error;
		}
	};

	/**
	 * Handle user login flow
	 * @param credentials - Login credentials
	 * @param options - Flow options
	 */
	const handleLogin = async (_options: UserFlowOptions = {}) => {
		try {
			// This would typically call the auth service
			// For now, we'll just navigate to the appropriate page
			const redirectPath = _options.redirectAfterAuth || '/dashboard';

			if (_options.showToast && _options.toastMessage) {
				toast.success(_options.toastMessage);
			}

			// Navigate to the intended destination
			navigate(redirectPath);
		} catch (error) {
			toast.error('Login failed. Please try again.');
			throw error;
		}
	};

	/**
	 * Handle room creation flow
	 * Redirects to register/login if not authenticated, otherwise creates room
	 */
	const handleCreateRoom = () => {
		if (!isAuthenticated) {
			// Store the intended action and redirect to register
			sessionStorage.setItem('intendedAction', 'createRoom');
			navigate('/register');
		} else {
			// User is authenticated, proceed to room creation
			navigate('/join-room');
		}
	};

	/**
	 * Handle join room flow
	 * Redirects to register/login if not authenticated, otherwise joins room
	 */
	const handleJoinRoom = (roomCode?: string) => {
		if (!isAuthenticated) {
			// Store the intended action and redirect to register
			sessionStorage.setItem('intendedAction', 'joinRoom');
			if (roomCode) {
				sessionStorage.setItem('roomCode', roomCode);
			}
			navigate('/register');
		} else {
			// User is authenticated, proceed to join room
			if (roomCode) {
				navigate(`/room/${roomCode}`);
			} else {
				navigate('/join-room');
			}
		}
	};

	/**
	 * Handle storage upgrade flow
	 * Redirects to register/login if not authenticated, otherwise proceeds to checkout
	 */
	const handleStorageUpgrade = async (
		tierId: string,
		currency?: string,
		billingCycle?: 'monthly' | 'yearly',
	) => {
		console.log('handleStorageUpgrade called with:', {
			tierId,
			currency,
			billingCycle,
			isAuthenticated,
		});
		if (!isAuthenticated) {
			console.log('User not authenticated in useUserFlow, redirecting to register');
			// Store the intended action and redirect to register
			sessionStorage.setItem('intendedAction', 'storageUpgrade');
			sessionStorage.setItem('upgradeTierId', tierId);
			if (currency) sessionStorage.setItem('upgradeCurrency', currency);
			if (billingCycle) sessionStorage.setItem('upgradeBillingCycle', billingCycle);
			navigate('/register');
		} else {
			console.log('User is authenticated in useUserFlow, proceeding with checkout');
			// User is authenticated, proceed to checkout
			try {
				// Import storage service dynamically to avoid circular dependencies
				const { storageService } = await import('../services/storage');
				// Only pass tierId and currency - backend determines pricing and billing cycle
				console.log('Creating checkout session in useUserFlow with:', {
					tierId,
					currency,
					billingCycle,
				});
				const session = await storageService.createCheckoutSession(tierId, currency, billingCycle);
				console.log('Checkout session created in useUserFlow:', session);
				console.log('Session URL in useUserFlow:', session.url);
				toast.success('Redirecting to checkout...');

				if (session.url) {
					console.log('Redirecting to in useUserFlow:', session.url);
					// Try multiple redirect methods
					try {
						window.location.assign(session.url);
					} catch (error) {
						console.error('window.location.assign failed in useUserFlow:', error);
						try {
							window.location.href = session.url;
						} catch (error2) {
							console.error('window.location.href failed in useUserFlow:', error2);
							// Fallback: open in new tab
							window.open(session.url, '_blank');
						}
					}
				} else {
					console.error('No URL in session object in useUserFlow:', session);
					toast.error('Checkout session created but no redirect URL found');
				}
			} catch (error: any) {
				console.error('Error in useUserFlow checkout:', error);
				const errorMessage = error.response?.data?.message || 'Failed to initiate checkout';
				toast.error(errorMessage);
			}
		}
	};

	/**
	 * Complete intended action after authentication
	 * Called after successful login/register
	 */
	const completeIntendedAction = () => {
		const intendedAction = sessionStorage.getItem('intendedAction');

		if (!intendedAction) {
			navigate('/dashboard');
			return;
		}

		switch (intendedAction) {
			case 'createRoom':
				sessionStorage.removeItem('intendedAction');
				navigate('/join-room');
				break;

			case 'joinRoom':
				const roomCode = sessionStorage.getItem('roomCode');
				sessionStorage.removeItem('intendedAction');
				sessionStorage.removeItem('roomCode');
				if (roomCode) {
					navigate(`/room/${roomCode}`);
				} else {
					navigate('/join-room');
				}
				break;

			case 'storageUpgrade':
				const tierId = sessionStorage.getItem('upgradeTierId');
				const currency = sessionStorage.getItem('upgradeCurrency');
				const billingCycle = sessionStorage.getItem('upgradeBillingCycle') as 'monthly' | 'yearly';

				sessionStorage.removeItem('intendedAction');
				sessionStorage.removeItem('upgradeTierId');
				sessionStorage.removeItem('upgradeCurrency');
				sessionStorage.removeItem('upgradeBillingCycle');

				// Navigate to calculator with upgrade parameters
				const params = new URLSearchParams();
				if (tierId) params.set('tier', tierId);
				if (currency) params.set('currency', currency);
				if (billingCycle) params.set('billing', billingCycle);

				navigate(`/calculator?${params.toString()}`);
				break;

			default:
				navigate('/dashboard');
		}
	};

	/**
	 * Check if user needs to complete an intended action
	 */
	const hasIntendedAction = (): boolean => {
		return !!sessionStorage.getItem('intendedAction');
	};

	return {
		handleRegister,
		handleLogin,
		handleCreateRoom,
		handleJoinRoom,
		handleStorageUpgrade,
		completeIntendedAction,
		hasIntendedAction,
		isAuthenticated,
		user,
	};
};
