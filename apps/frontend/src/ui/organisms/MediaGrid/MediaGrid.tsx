// MediaGrid Organism Component

import { Card, CardContent } from '@/components/ui/card';
import React from 'react';
import { Loader } from 'react-feather';
import { Media } from '../../../types';
import { MediaCard } from '../../molecules/MediaCard';

export interface MediaGridProps {
	media: Media[];
	onPlay?: (media: Media) => void;
	onDelete?: (mediaId: string) => void;
	onEdit?: (media: Media) => void;
	isLoading?: boolean;
	emptyMessage?: string;
	className?: string;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
	media,
	onPlay,
	onDelete,
	onEdit,
	isLoading = false,
	emptyMessage = 'No media found',
}) => {
	if (isLoading) {
		return (
			<div className='flex flex-col items-center justify-center min-h-[400px]'>
				<Card className='bg-background/40 backdrop-blur-lg border-border/30 p-8'>
					<CardContent className='flex flex-col items-center gap-4'>
						<Loader className='w-8 h-8 text-primary animate-spin' />
						<p className='text-white/80'>Loading media...</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (media.length === 0) {
		return (
			<div className='flex flex-col items-center justify-center min-h-[400px]'>
				<Card className='bg-background/40 backdrop-blur-lg border-border/30 p-8'>
					<CardContent className='text-center'>
						<p className='text-white/80 text-lg'>{emptyMessage}</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
			{media.map((item) => (
				<MediaCard
					key={item.id}
					media={item}
					onPlay={onPlay}
					onDelete={onDelete}
					onEdit={onEdit}
				/>
			))}
		</div>
	);
};
