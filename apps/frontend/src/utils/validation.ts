// Frontend validation schemas matching backend exactly

// Username validation: 3-30 chars, alphanumeric + underscore/hyphen
export const validateUsername = (username: string): string | null => {
	if (!username.trim()) {
		return 'Username is required';
	}

	if (username.length < 3) {
		return 'Username must be at least 3 characters';
	}

	if (username.length > 30) {
		return 'Username must be less than 30 characters';
	}

	if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
		return 'Username can only contain letters, numbers, underscores, and hyphens';
	}

	return null;
};

// Email validation
export const validateEmail = (email: string): string | null => {
	if (!email.trim()) {
		return 'Email is required';
	}

	if (email.length > 254) {
		return 'Email too long';
	}

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
		return 'Invalid email format';
	}

	return null;
};

// Password validation: 8+ chars, at least one uppercase, lowercase, number
export const validatePassword = (password: string): string | null => {
	if (!password) {
		return 'Password is required';
	}

	if (password.length < 8) {
		return 'Password must be at least 8 characters';
	}

	if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
		return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
	}

	return null;
};

// Login validation (simpler - just required fields)
export const validateLoginUsername = (username: string): string | null => {
	if (!username.trim()) {
		return 'Username is required';
	}
	return null;
};

export const validateLoginPassword = (password: string): string | null => {
	if (!password) {
		return 'Password is required';
	}
	return null;
};

// Form validation helpers
export interface ValidationResult {
	isValid: boolean;
	errors: Record<string, string>;
}

export const validateLoginForm = (formData: {
	username: string;
	password: string;
}): ValidationResult => {
	const errors: Record<string, string> = {};

	const usernameError = validateLoginUsername(formData.username);
	if (usernameError) errors.username = usernameError;

	const passwordError = validateLoginPassword(formData.password);
	if (passwordError) errors.password = passwordError;

	return {
		isValid: Object.keys(errors).length === 0,
		errors,
	};
};

export const validateRegisterForm = (formData: {
	username: string;
	email: string;
	password: string;
	confirmPassword: string;
}): ValidationResult => {
	const errors: Record<string, string> = {};

	const usernameError = validateUsername(formData.username);
	if (usernameError) errors.username = usernameError;

	const emailError = validateEmail(formData.email);
	if (emailError) errors.email = emailError;

	const passwordError = validatePassword(formData.password);
	if (passwordError) errors.password = passwordError;

	if (!formData.confirmPassword) {
		errors.confirmPassword = 'Please confirm your password';
	} else if (formData.password !== formData.confirmPassword) {
		errors.confirmPassword = 'Passwords do not match';
	}

	return {
		isValid: Object.keys(errors).length === 0,
		errors,
	};
};
