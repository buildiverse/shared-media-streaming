// MediaGrid Organism Component

import React from 'react';
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
	className = '',
}) => {
	const gridClasses = ['media-grid', className].filter(Boolean).join(' ');

	if (isLoading) {
		return (
			<div className={gridClasses}>
				<div>
					<p>Loading media...</p>
				</div>
			</div>
		);
	}

	if (media.length === 0) {
		return (
			<div className={gridClasses}>
				<div>
					<p>{emptyMessage}</p>
				</div>
			</div>
		);
	}

	return (
		<div className={gridClasses}>
			{media.map((item) => (
				<div key={item.id}>
					<MediaCard
						media={item}
						onPlay={onPlay}
						onDelete={onDelete}
						onEdit={onEdit}
					/>
				</div>
			))}
		</div>
	);
};
