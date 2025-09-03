import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/providers/ToastProvider';
import { ApiService } from '@/services/api.service';
import { validateEmail, validateRegisterForm, validateUsername } from '@/utils/validation';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const RegisterPage: React.FC = () => {
	const navigate = useNavigate();
	const { register, isLoading, error, clearError } = useAuth();
	const toast = useToast();
	const [formData, setFormData] = useState({
		username: '',
		email: '',
		password: '',
		confirmPassword: '',
	});
	const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
	const [isCheckingUsername, setIsCheckingUsername] = useState(false);
	const [isCheckingEmail, setIsCheckingEmail] = useState(false);
	const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
	const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
	const [passwordStrength, setPasswordStrength] = useState<{
		score: number;
		label: string;
		color: string;
	} | null>(null);
	const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null);

	const calculatePasswordStrength = (password: string) => {
		if (!password) {
			setPasswordStrength(null);
			return;
		}

		let score = 0;
		const checks = {
			length: password.length >= 8,
			lowercase: /[a-z]/.test(password),
			uppercase: /[A-Z]/.test(password),
			number: /\d/.test(password),
			special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
		};

		// Calculate score
		Object.values(checks).forEach((check) => {
			if (check) score++;
		});

		// Determine strength level and color
		let label: string;
		let color: string;

		if (score <= 2) {
			label = 'Weak';
			color = 'text-red-500';
		} else if (score === 3) {
			label = 'Fair';
			color = 'text-yellow-500';
		} else if (score === 4) {
			label = 'Good';
			color = 'text-primary';
		} else {
			label = 'Strong';
			color = 'text-green-500';
		}

		setPasswordStrength({ score, label, color });
	};

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (error) clearError();
		// Clear validation error for this field
		if (validationErrors[field]) {
			setValidationErrors((prev) => ({ ...prev, [field]: '' }));
		}
		// Reset availability status when user types
		if (field === 'username') {
			setUsernameAvailable(null);
		}
		if (field === 'email') {
			setEmailAvailable(null);
		}
		// Calculate password strength
		if (field === 'password') {
			calculatePasswordStrength(value);
			// Reset password match when password changes
			setPasswordMatch(null);
		}
		// Reset password match when confirm password changes
		if (field === 'confirmPassword') {
			setPasswordMatch(null);
		}
	};

	const handleUsernameBlur = async () => {
		if (!formData.username.trim()) return;

		// First validate format
		const formatError = validateUsername(formData.username);
		if (formatError) {
			setValidationErrors((prev) => ({ ...prev, username: formatError }));
			toast.validationError('Username', formatError);
			return;
		}

		// Check availability
		setIsCheckingUsername(true);
		try {
			const response = await ApiService.checkUsernameAvailability(formData.username);
			setUsernameAvailable(!response.exists);

			if (response.exists) {
				const errorMsg = 'Username is already taken';
				setValidationErrors((prev) => ({ ...prev, username: errorMsg }));
				toast.validationError('Username', errorMsg);
			} else {
				// Clear any existing error
				setValidationErrors((prev) => ({ ...prev, username: '' }));
				toast.success('Username available!', {
					description: `${formData.username} is available`,
					duration: 3000,
				});
			}
		} catch (error) {
			console.error('Error checking username:', error);
			toast.error('Failed to check username availability');
		} finally {
			setIsCheckingUsername(false);
		}
	};

	const handleEmailBlur = async () => {
		if (!formData.email.trim()) return;

		// First validate format
		const formatError = validateEmail(formData.email);
		if (formatError) {
			setValidationErrors((prev) => ({ ...prev, email: formatError }));
			toast.validationError('Email', formatError);
			return;
		}

		// Check availability
		setIsCheckingEmail(true);
		try {
			const response = await ApiService.checkEmailAvailability(formData.email);
			setEmailAvailable(!response.exists);

			if (response.exists) {
				const errorMsg = 'Email is already registered';
				setValidationErrors((prev) => ({ ...prev, email: errorMsg }));
				toast.validationError('Email', errorMsg);
			} else {
				// Clear any existing error
				setValidationErrors((prev) => ({ ...prev, email: '' }));
				toast.success('Email available!', {
					description: `${formData.email} is available`,
					duration: 3000,
				});
			}
		} catch (error) {
			console.error('Error checking email:', error);
			toast.error('Failed to check email availability');
		} finally {
			setIsCheckingEmail(false);
		}
	};

	const handleConfirmPasswordBlur = () => {
		if (!formData.confirmPassword || !formData.password) {
			setPasswordMatch(null);
			return;
		}

		const matches = formData.password === formData.confirmPassword;
		setPasswordMatch(matches);

		if (!matches) {
			const errorMsg = 'Passwords do not match';
			setValidationErrors((prev) => ({ ...prev, confirmPassword: errorMsg }));
			toast.validationError('Confirm Password', errorMsg);
		} else {
			// Clear any existing error
			setValidationErrors((prev) => ({ ...prev, confirmPassword: '' }));
			toast.success('Passwords match!', {
				description: 'Your passwords are matching',
				duration: 3000,
			});
		}
	};

	const validateForm = () => {
		// Use backend validation rules
		const validation = validateRegisterForm(formData);
		setValidationErrors(validation.errors);

		// Check availability status
		if (usernameAvailable === false) {
			validation.errors.username = 'Username is already taken';
			validation.isValid = false;
		}

		if (emailAvailable === false) {
			validation.errors.email = 'Email is already registered';
			validation.isValid = false;
		}

		// Show first validation error
		if (!validation.isValid) {
			const firstError = Object.entries(validation.errors)[0];
			if (firstError) {
				toast.validationError(firstError[0], firstError[1]);
			}
		}

		return validation.isValid;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		try {
			const { confirmPassword, ...credentials } = formData;
			await register(credentials);
			toast.registerSuccess(formData.username);
			navigate('/');
		} catch (error) {
			console.error('Registration failed:', error);
			toast.registerError(error instanceof Error ? error.message : 'An unexpected error occurred');
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
						<CardTitle className='text-2xl font-bold'>Create Account</CardTitle>
						<CardDescription>Join us! Create your account to get started</CardDescription>
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
									onBlur={handleUsernameBlur}
									required
									disabled={isLoading || isCheckingUsername}
								/>
								{isCheckingUsername && (
									<p className='text-sm text-muted-foreground'>Checking availability...</p>
								)}
								{validationErrors.username && (
									<p className='text-sm text-red-600'>{validationErrors.username}</p>
								)}
								{usernameAvailable === true && (
									<p className='text-sm text-green-600'>✓ Username is available</p>
								)}
							</div>

							<div className='space-y-2'>
								<Label htmlFor='email'>Email</Label>
								<Input
									id='email'
									type='email'
									placeholder='Enter your email'
									value={formData.email}
									onChange={(e) => handleInputChange('email', e.target.value)}
									onBlur={handleEmailBlur}
									required
									disabled={isLoading || isCheckingEmail}
								/>
								{isCheckingEmail && (
									<p className='text-sm text-muted-foreground'>Checking availability...</p>
								)}
								{validationErrors.email && (
									<p className='text-sm text-red-600'>{validationErrors.email}</p>
								)}
								{emailAvailable === true && (
									<p className='text-sm text-green-600'>✓ Email is available</p>
								)}
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
								{passwordStrength && (
									<div className='flex items-center gap-2'>
										<div className='flex-1 bg-muted rounded-full h-2'>
											<div
												className={`h-2 rounded-full transition-all duration-300 ${
													passwordStrength.score <= 2
														? 'bg-red-500'
														: passwordStrength.score === 3
															? 'bg-yellow-500'
															: passwordStrength.score === 4
																? 'bg-primary'
																: 'bg-green-500'
												}`}
												style={{
													width: `${(passwordStrength.score / 5) * 100}%`,
												}}
											/>
										</div>
										<span className={`text-sm font-medium ${passwordStrength.color}`}>
											{passwordStrength.label}
										</span>
									</div>
								)}
								{validationErrors.password && (
									<p className='text-sm text-red-600'>{validationErrors.password}</p>
								)}
								<p className='text-xs text-muted-foreground'>
									Password must be at least 8 characters with uppercase, lowercase, and number
								</p>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='confirmPassword'>Confirm Password</Label>
								<Input
									id='confirmPassword'
									type='password'
									placeholder='Confirm your password'
									value={formData.confirmPassword}
									onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
									onBlur={handleConfirmPasswordBlur}
									required
									disabled={isLoading}
								/>
								{passwordMatch === true && (
									<p className='text-sm text-green-600'>✓ Passwords match</p>
								)}
								{passwordMatch === false && (
									<p className='text-sm text-red-600'>✗ Passwords don't match</p>
								)}
								{validationErrors.confirmPassword && passwordMatch !== false && (
									<p className='text-sm text-red-600'>{validationErrors.confirmPassword}</p>
								)}
							</div>

							<Button
								type='submit'
								className='w-full'
								disabled={isLoading}
							>
								{isLoading ? 'Creating Account...' : 'Create Account'}
							</Button>
						</form>

						<div className='mt-6 text-center text-sm'>
							Already have an account?{' '}
							<Link
								to='/login'
								className='text-primary hover:text-primary/80 font-medium'
								onClick={clearError}
							>
								Sign in here
							</Link>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};
