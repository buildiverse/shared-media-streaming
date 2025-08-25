import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../../ui/templates/AuthLayout';
import { RegisterForm } from '../components/RegisterForm';
import { useAuth } from '../hooks/useAuth';

export const RegisterPage: React.FC = () => {
	const navigate = useNavigate();
	const { register, isLoading, error, clearError } = useAuth();

	const handleRegister = async (credentials: {
		username: string;
		email: string;
		password: string;
	}) => {
		try {
			await register(credentials);
			navigate('/dashboard');
		} catch (error) {
			// Error is handled by useAuth hook
			console.error('Registration failed:', error);
		}
	};

	const handleErrorClear = () => {
		clearError();
	};

	return (
		<AuthLayout>
			<div>
				<h1>Create Account</h1>
				<p>Join us! Create your account to get started.</p>

				<RegisterForm
					onRegister={handleRegister}
					isLoading={isLoading}
					error={error || ''}
				/>

				<div>
					<p>
						Already have an account?{' '}
						<Link
							to='/login'
							onClick={handleErrorClear}
						>
							Sign in here
						</Link>
					</p>
				</div>
			</div>
		</AuthLayout>
	);
};
