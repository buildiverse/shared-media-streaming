import { toast } from 'sonner';

export interface ToastOptions {
	title?: string;
	description?: string;
	duration?: number;
	action?: {
		label: string;
		onClick: () => void;
	};
}

export class ToastService {
	private static instance: ToastService;

	private constructor() {}

	public static getInstance(): ToastService {
		if (!ToastService.instance) {
			ToastService.instance = new ToastService();
		}
		return ToastService.instance;
	}

	// Success toast
	public success(message: string, options?: ToastOptions): void {
		toast.success(message, {
			description: options?.description,
			duration: options?.duration || 4000,
			action: options?.action,
		});
	}

	// Error toast
	public error(message: string, options?: ToastOptions): void {
		toast.error(message, {
			description: options?.description,
			duration: options?.duration || 6000,
			action: options?.action,
		});
	}

	// Warning toast
	public warning(message: string, options?: ToastOptions): void {
		toast.warning(message, {
			description: options?.description,
			duration: options?.duration || 5000,
			action: options?.action,
		});
	}

	// Info toast
	public info(message: string, options?: ToastOptions): void {
		toast.info(message, {
			description: options?.description,
			duration: options?.duration || 4000,
			action: options?.action,
		});
	}

	// Loading toast
	public loading(message: string, options?: ToastOptions): string {
		return toast.loading(message, {
			description: options?.description,
		}) as string;
	}

	// Storage exceeded toast with action
	public storageExceededWithCountdown(
		message: string,
		options?: ToastOptions & { durationMs?: number },
	): void {
		const duration = options?.durationMs ?? 6000;
		toast.error('Storage limit exceeded', {
			description: message,
			duration,
			action: options?.action
				? {
						label: options.action.label,
						onClick: options.action.onClick,
					}
				: undefined,
		});
	}

	// Promise toast
	public promise<T>(
		promise: Promise<T>,
		messages: {
			loading: string;
			success: string | ((data: T) => string);
			error: string | ((error: any) => string);
		},
	): Promise<T> {
		return toast.promise(promise, messages) as unknown as Promise<T>;
	}

	// Dismiss toast
	public dismiss(toastId?: string): void {
		toast.dismiss(toastId);
	}

	// Form validation helpers
	public validationError(field: string, message: string): void {
		this.error(`Validation Error`, {
			description: `${field}: ${message}`,
			duration: 5000,
		});
	}

	public validationSuccess(message: string): void {
		this.success('Validation Passed', {
			description: message,
			duration: 3000,
		});
	}

	// Auth helpers
	public loginSuccess(username: string): void {
		this.success('Welcome back!', {
			description: `Successfully logged in as ${username}`,
			duration: 4000,
		});
	}

	public loginError(message: string): void {
		this.error('Login Failed', {
			description: message,
			duration: 6000,
		});
	}

	public registerSuccess(username: string): void {
		this.success('Account Created!', {
			description: `Welcome ${username}! Your account has been created successfully.`,
			duration: 5000,
		});
	}

	public registerError(message: string): void {
		this.error('Registration Failed', {
			description: message,
			duration: 6000,
		});
	}
}

// Export singleton instance
export const toastService = ToastService.getInstance();
