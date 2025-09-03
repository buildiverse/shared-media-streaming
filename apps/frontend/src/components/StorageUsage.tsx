import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { HardDrive, TrendingUp, Upload } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../app/providers/AuthProvider';
import { useStorage } from '../hooks/useStorage';

interface StorageUsageProps {
	showUpgradeButton?: boolean;
	showUploadButton?: boolean;
	compact?: boolean;
}

export const StorageUsage: React.FC<StorageUsageProps> = ({
	showUpgradeButton = true,
	showUploadButton = false,
	compact = false,
}) => {
	const { stats, isLoading, formatBytes } = useStorage();
	const { isAuthenticated } = useAuth();

	// Don't render if user is not authenticated
	if (!isAuthenticated) {
		return null;
	}

	// Show loading state
	if (isLoading || !stats) {
		return (
			<Card className='w-full'>
				<CardHeader className={compact ? 'pb-2' : ''}>
					<CardTitle className='flex items-center gap-2 text-sm'>
						<HardDrive className='h-4 w-4' />
						Storage Usage
					</CardTitle>
				</CardHeader>
				<CardContent className={compact ? 'pt-0' : ''}>
					<div className='animate-pulse'>
						<div className='h-2 bg-muted rounded mb-2'></div>
						<div className='h-4 bg-muted rounded w-1/2'></div>
					</div>
				</CardContent>
			</Card>
		);
	}

	const usagePercentage = Math.round(stats.usagePercentage);
	const isNearLimit = usagePercentage >= 80;
	const isAtLimit = usagePercentage >= 95;

	const getProgressColor = () => {
		if (isAtLimit) return 'bg-red-500';
		if (isNearLimit) return 'bg-yellow-500';
		return 'bg-primary';
	};

	const getStatusText = () => {
		if (isAtLimit) return 'Storage nearly full';
		if (isNearLimit) return 'Storage getting full';
		return 'Storage usage';
	};

	const getStatusColor = () => {
		if (isAtLimit) return 'text-red-500';
		if (isNearLimit) return 'text-yellow-500';
		return 'text-muted-foreground';
	};

	return (
		<Card className='w-full'>
			<CardHeader className={compact ? 'pb-2' : ''}>
				<CardTitle className='flex items-center gap-2 text-sm'>
					<HardDrive className='h-4 w-4' />
					{getStatusText()}
				</CardTitle>
				{!compact && (
					<CardDescription>
						{formatBytes(stats.currentUsage)} of {formatBytes(stats.maxLimit)} used
					</CardDescription>
				)}
			</CardHeader>
			<CardContent className={compact ? 'pt-0' : ''}>
				<div className='space-y-3'>
					<div className='space-y-2'>
						<div className='flex justify-between text-sm'>
							<span className={getStatusColor()}>{usagePercentage}% used</span>
							<span className='text-muted-foreground'>
								{formatBytes(stats.remainingSpace)} remaining
							</span>
						</div>
						<Progress
							value={usagePercentage}
							className='h-2'
						/>
					</div>

					{/* Action Buttons */}
					<div className='flex gap-2'>
						{showUploadButton && (
							<Button
								asChild
								variant='default'
								size='sm'
								className='flex-1'
							>
								<Link to='/upload'>
									<Upload className='h-4 w-4 mr-2' />
									Upload Media
								</Link>
							</Button>
						)}

						{showUpgradeButton && (isNearLimit || !compact) && (
							<Button
								asChild
								variant={isAtLimit ? 'destructive' : 'outline'}
								size='sm'
								className={showUploadButton ? 'flex-1' : 'w-full'}
							>
								<Link to='/calculator'>
									<TrendingUp className='h-4 w-4 mr-2' />
									{isAtLimit ? 'Upgrade Now' : 'View Storage Plans'}
								</Link>
							</Button>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
};
