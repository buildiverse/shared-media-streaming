// MediaCard Molecule Component

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import React, { useState } from 'react';
import { Edit, File, Music, Play, Trash2 } from 'react-feather';
import { Media } from '../../../types';
import { formatDate, formatDuration, formatFileSize } from '../../../utils';

export interface MediaCardProps {
	media: Media;
	onPlay?: (media: Media) => void;
	onDelete?: (mediaId: string) => void;
	onEdit?: (media: Media) => void;
	className?: string;
}

export const MediaCard: React.FC<MediaCardProps> = ({
	media,
	onPlay,
	onDelete,
	onEdit,
	className = '',
}) => {
	const isVideo = media.mimeType.startsWith('video/');
	const isAudio = media.mimeType.startsWith('audio/');
	const [currentThumbnailIndex, setCurrentThumbnailIndex] = useState(0);
	const [isHovering, setIsHovering] = useState(false);

	// Thumbnail cycling effect
	React.useEffect(() => {
		if (isHovering && media.thumbnails && media.thumbnails.length > 1) {
			const interval = setInterval(() => {
				setCurrentThumbnailIndex((prev) => (prev + 1) % media.thumbnails.length);
			}, 500); // Change thumbnail every 500ms

			return () => clearInterval(interval);
		}
	}, [isHovering, media.thumbnails]);

	const currentThumbnail =
		media.thumbnails && media.thumbnails.length > 0
			? media.thumbnails[currentThumbnailIndex]
			: null;

	return (
		<Card
			className={`bg-background/40 backdrop-blur-lg border-border/30 ${className}`}
			onMouseEnter={() => setIsHovering(true)}
			onMouseLeave={() => {
				setIsHovering(false);
				setCurrentThumbnailIndex(0); // Reset to first thumbnail when not hovering
			}}
		>
			<CardHeader>
				<div className='flex items-start justify-between'>
					<div className='flex items-center gap-2'>
						{isVideo ? (
							<File className='w-5 h-5 text-primary' />
						) : isAudio ? (
							<Music className='w-5 h-5 text-primary' />
						) : (
							<File className='w-5 h-5 text-primary' />
						)}
						<CardTitle className='text-white text-lg'>{media.title}</CardTitle>
					</div>
				</div>
			</CardHeader>

			<CardContent className='space-y-4'>
				{/* Media Preview with Thumbnails */}
				<div className='rounded-lg overflow-hidden bg-muted/20'>
					{isVideo && currentThumbnail ? (
						<div className='relative w-full h-48'>
							<img
								src={currentThumbnail}
								alt={`Thumbnail ${currentThumbnailIndex + 1} of ${media.title}`}
								className='w-full h-full object-cover'
							/>
							{/* Play overlay */}
							<div className='absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity'>
								<Play className='w-12 h-12 text-white' />
							</div>
						</div>
					) : isVideo ? (
						<video
							controls
							preload='metadata'
							aria-label={`Video preview of ${media.title}`}
							className='w-full h-48 object-cover'
						>
							<source
								src={media.url}
								type={media.mimeType}
							/>
							Your browser does not support the video tag.
						</video>
					) : isAudio ? (
						<div className='p-4'>
							<audio
								controls
								preload='metadata'
								aria-label={`Audio preview of ${media.title}`}
								className='w-full'
							>
								<source
									src={media.url}
									type={media.mimeType}
								/>
								Your browser does not support the audio tag.
							</audio>
						</div>
					) : (
						<div className='w-full h-48 flex items-center justify-center bg-muted/20'>
							<File className='w-12 h-12 text-white/50' />
						</div>
					)}
				</div>

				{/* Media Info */}
				<div className='grid grid-cols-2 gap-2 text-sm'>
					<div className='text-white/60'>Size:</div>
					<div className='text-white'>{formatFileSize(media.size)}</div>

					<div className='text-white/60'>Type:</div>
					<div className='text-white'>{media.mimeType}</div>

					{media.duration > 0 && (
						<>
							<div className='text-white/60'>Duration:</div>
							<div className='text-white'>{formatDuration(media.duration)}</div>
						</>
					)}

					<div className='text-white/60'>Uploaded:</div>
					<div className='text-white'>{formatDate(media.createdAt)}</div>
				</div>

				{/* Action Buttons */}
				<div className='flex gap-2 pt-2'>
					{onPlay && (
						<Button
							onClick={() => onPlay(media)}
							aria-label={`Play ${media.title}`}
							size='sm'
							className='flex-1 bg-primary hover:bg-primary/90 text-primary-foreground'
						>
							<Play className='w-4 h-4 mr-1' />
							Play
						</Button>
					)}

					{onEdit && (
						<Button
							onClick={() => onEdit(media)}
							aria-label={`Edit ${media.title}`}
							size='sm'
							variant='outline'
							className='border-white/20 text-white hover:bg-white/10'
						>
							<Edit className='w-4 h-4' />
						</Button>
					)}

					{onDelete && (
						<Button
							onClick={() => onDelete(media.id)}
							aria-label={`Delete ${media.title}`}
							size='sm'
							variant='outline'
							className='border-red-500/50 text-red-500 hover:bg-red-500/10'
						>
							<Trash2 className='w-4 h-4' />
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	);
};
