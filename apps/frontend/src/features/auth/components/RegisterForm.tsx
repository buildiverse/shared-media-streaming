import React, { useState } from 'react';
import { Button } from '../../../ui/atoms/Button';
import { FormField } from '../../../ui/molecules/FormField';

interface RegisterCredentials {
	username: string;
	email: string;
	password: string;
	confirmPassword: string;
}

interface RegisterFormProps {
	onRegister: (credentials: Omit<RegisterCredentials, 'confirmPassword'>) => void;
	isLoading?: boolean;
	error?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
	onRegister,
	isLoading = false,
	error = '',
}) => {
	const [formData, setFormData] = useState<RegisterCredentials>({
		username: '',
		email: '',
		password: '',
		confirmPassword: '',
	});

	const [validationErrors, setValidationErrors] = useState<Partial<RegisterCredentials>>({});

	const handleInputChange = (field: keyof RegisterCredentials, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		// Clear validation error when user starts typing
		if (validationErrors[field]) {
			setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	const validateForm = (): boolean => {
		const errors: Partial<RegisterCredentials> = {};

		if (!formData.username.trim()) {
			errors.username = 'Username is required';
		} else if (formData.username.length < 3) {
			errors.username = 'Username must be at least 3 characters';
		}

		if (!formData.email.trim()) {
			errors.email = 'Email is required';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			errors.email = 'Please enter a valid email address';
		}

		if (!formData.password) {
			errors.password = 'Password is required';
		} else if (formData.password.length < 6) {
			errors.password = 'Password must be at least 6 characters';
		}

		if (!formData.confirmPassword) {
			errors.confirmPassword = 'Please confirm your password';
		} else if (formData.password !== formData.confirmPassword) {
			errors.confirmPassword = 'Passwords do not match';
		}

		setValidationErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (validateForm()) {
			const { confirmPassword, ...credentials } = formData;
			onRegister(credentials);
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			{error && <div role='alert'>{error}</div>}

			<FormField
				label='Username'
				name='username'
				value={formData.username}
				onChange={(value) => handleInputChange('username', value)}
				placeholder='Enter your username'
				required
				error={validationErrors.username}
			/>

			<FormField
				label='Email'
				type='email'
				name='email'
				value={formData.email}
				onChange={(value) => handleInputChange('email', value)}
				placeholder='Enter your email'
				required
				error={validationErrors.email}
			/>

			<FormField
				label='Password'
				type='password'
				name='password'
				value={formData.password}
				onChange={(value) => handleInputChange('password', value)}
				placeholder='Enter your password'
				required
				error={validationErrors.password}
			/>

			<FormField
				label='Confirm Password'
				type='password'
				name='confirmPassword'
				value={formData.confirmPassword}
				onChange={(value) => handleInputChange('confirmPassword', value)}
				placeholder='Confirm your password'
				required
				error={validationErrors.confirmPassword}
			/>

			<Button
				type='submit'
				disabled={isLoading}
			>
				{isLoading ? 'Creating Account...' : 'Create Account'}
			</Button>
		</form>
	);
};
