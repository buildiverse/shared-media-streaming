// LoginForm Component

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginCredentials } from '../../../types';
import { Button } from '../../../ui/atoms/Button';
import { FormField } from '../../../ui/molecules/FormField';
import { validatePassword, validateUsername } from '../../../utils';

export interface LoginFormProps {
	onLogin: (credentials: LoginCredentials) => Promise<void>;
	isLoading?: boolean;
	error?: string;
	className?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
	onLogin,
	isLoading = false,
	error,
	className = '',
}) => {
	const navigate = useNavigate();
	const [formData, setFormData] = useState<LoginCredentials>({
		username: '',
		password: '',
	});
	const [validationErrors, setValidationErrors] = useState<Partial<LoginCredentials>>({});

	const handleInputChange = (field: keyof LoginCredentials, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		// Clear validation error when user starts typing
		if (validationErrors[field]) {
			setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	const validateForm = (): boolean => {
		const errors: Partial<LoginCredentials> = {};

		if (!validateUsername(formData.username)) {
			errors.username = 'Username must be between 3 and 20 characters';
		}

		if (!validatePassword(formData.password)) {
			errors.password = 'Password must be at least 8 characters';
		}

		setValidationErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		try {
			await onLogin(formData);
			// Navigation is handled by the parent LoginPage
		} catch (err) {
			// Error is handled by parent component
		}
	};

	return (
		<div className={className}>
			<form
				onSubmit={handleSubmit}
				noValidate
			>
				{error && <div role='alert'>{error}</div>}

				<FormField
					label='Username'
					name='username'
					type='text'
					value={formData.username}
					onChange={(value) => handleInputChange('username', value)}
					placeholder='Enter your username'
					required
					error={validationErrors.username}
				/>

				<FormField
					label='Password'
					name='password'
					type='password'
					value={formData.password}
					onChange={(value) => handleInputChange('password', value)}
					placeholder='Enter your password'
					required
					error={validationErrors.password}
				/>

				<div>
					<Button
						type='submit'
						disabled={isLoading}
					>
						{isLoading ? 'Signing in...' : 'Sign In'}
					</Button>
				</div>
			</form>
		</div>
	);
};
