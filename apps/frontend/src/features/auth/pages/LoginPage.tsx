import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../../ui/templates/AuthLayout';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';

export const LoginPage: React.FC = () => {
	const navigate = useNavigate();
	const { login, isLoading, error, clearError } = useAuth();

	const handleLogin = async (credentials: { username: string; password: string }) => {
		try {
			await login(credentials);
			navigate('/');
		} catch (error) {
			// Error is handled by useAuth hook
			console.error('Login failed:', error);
		}
	};

	const handleErrorClear = () => {
		clearError();
	};

	return (
		<AuthLayout>
			<div>
				<h1>Sign In</h1>
				<p>Welcome back! Please sign in to your account.</p>

				<LoginForm
					onLogin={handleLogin}
					isLoading={isLoading}
					error={error || ''}
				/>

				<div>
					<p>
						Don't have an account?{' '}
						<Link
							to='/register'
							onClick={handleErrorClear}
						>
							Sign up here
						</Link>
					</p>
				</div>
			</div>
		</AuthLayout>
	);
};
