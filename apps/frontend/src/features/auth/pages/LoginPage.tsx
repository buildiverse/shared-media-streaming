import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/providers/ToastProvider';
import { validateLoginForm } from '@/utils/validation';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useUserFlow } from '../../../use-cases/userFlow';

export const LoginPage: React.FC = () => {
	const { login, isLoading, error, clearError } = useAuth();
	const { completeIntendedAction } = useUserFlow();
	const toast = useToast();
	const [formData, setFormData] = useState({
		username: '',
		password: '',
	});

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (error) clearError();
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Client-side validation using backend rules
		const validation = validateLoginForm(formData);
		if (!validation.isValid) {
			// Show first validation error
			const firstError = Object.entries(validation.errors)[0];
			if (firstError) {
				toast.validationError(firstError[0], firstError[1]);
			}
			return;
		}

		try {
			await login(formData);
			toast.loginSuccess(formData.username);

			// Complete any intended action after successful login
			completeIntendedAction();
		} catch (error) {
			console.error('Login failed:', error);
			toast.loginError(error instanceof Error ? error.message : 'An unexpected error occurred');
		}
	};

	return (
		<div className='min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden'>
			{/* Animated Background Shapes */}
			<div className='absolute inset-0 pointer-events-none'>
				{/* Large Circle */}
				<div
					className='absolute w-96 h-96 bg-primary/20 rounded-full'
					style={{
						top: '10%',
						left: '-10%',
						animation: 'floatCircle 20s ease-in-out infinite',
						filter: 'blur(60px)',
					}}
				></div>

				{/* First Oval */}
				<div
					className='absolute w-80 h-60 bg-primary/15 rounded-full'
					style={{
						top: '60%',
						right: '-5%',
						animation: 'floatOval1 25s ease-in-out infinite',
						filter: 'blur(45px)',
					}}
				></div>

				{/* Second Oval */}
				<div
					className='absolute w-72 h-48 bg-primary/25 rounded-full'
					style={{
						bottom: '20%',
						left: '20%',
						animation: 'floatOval2 30s ease-in-out infinite',
						filter: 'blur(45px)',
					}}
				></div>
			</div>

			<div className='w-full max-w-md relative z-10'>
				<Card className='bg-background/40 backdrop-blur-lg border-border/30'>
					<CardHeader className='text-center space-y-4'>
						<div className='mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center'>
							<span className='text-2xl font-bold text-white'>SMS</span>
						</div>
						<CardTitle className='text-2xl font-bold'>Welcome back</CardTitle>
						<CardDescription>Enter your credentials to sign in to your account</CardDescription>
					</CardHeader>
					<CardContent>
						<form
							onSubmit={handleSubmit}
							className='space-y-4'
						>
							<div className='space-y-2'>
								<Label htmlFor='username'>Username</Label>
								<Input
									id='username'
									type='text'
									placeholder='Enter your username'
									value={formData.username}
									onChange={(e) => handleInputChange('username', e.target.value)}
									required
									disabled={isLoading}
								/>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='password'>Password</Label>
								<Input
									id='password'
									type='password'
									placeholder='Enter your password'
									value={formData.password}
									onChange={(e) => handleInputChange('password', e.target.value)}
									required
									disabled={isLoading}
								/>
							</div>

							<Button
								type='submit'
								className='w-full'
								disabled={isLoading}
							>
								{isLoading ? 'Signing in...' : 'Sign In'}
							</Button>
						</form>

						<div className='mt-6 text-center text-sm'>
							Don't have an account?{' '}
							<Link
								to='/register'
								className='text-primary hover:text-primary/80 font-medium'
								onClick={clearError}
							>
								Sign up here
							</Link>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};
