// MediaCard Molecule Component

import React from 'react';
import { Media } from '../../../types';
import { formatDate, formatDuration, formatFileSize } from '../../../utils';
import { Button } from '../../atoms/Button';

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

	return (
		<article className={className}>
			<div>
				<h3>{media.title}</h3>
				{media.description && <p>{media.description}</p>}
			</div>

			<div>
				{isVideo && (
					<video
						controls
						preload='metadata'
						aria-label={`Video preview of ${media.title}`}
					>
						<source
							src={media.url}
							type={media.mimeType}
						/>
						Your browser does not support the video tag.
					</video>
				)}

				{isAudio && (
					<audio
						controls
						preload='metadata'
						aria-label={`Audio preview of ${media.title}`}
					>
						<source
							src={media.url}
							type={media.mimeType}
						/>
						Your browser does not support the audio tag.
					</audio>
				)}

				<div>
					<dl>
						<dt>File Size:</dt>
						<dd>{formatFileSize(media.size)}</dd>

						<dt>Type:</dt>
						<dd>{media.mimeType}</dd>

						{media.duration && (
							<>
								<dt>Duration:</dt>
								<dd>{formatDuration(media.duration)}</dd>
							</>
						)}

						<dt>Uploaded:</dt>
						<dd>{formatDate(media.createdAt)}</dd>

						<dt>By:</dt>
						<dd>{media.uploadedBy}</dd>
					</dl>
				</div>
			</div>

			<div>
				{onPlay && (
					<Button
						onClick={() => onPlay(media)}
						aria-label={`Play ${media.title}`}
					>
						Play
					</Button>
				)}

				{onEdit && (
					<Button
						onClick={() => onEdit(media)}
						aria-label={`Edit ${media.title}`}
					>
						Edit
					</Button>
				)}

				{onDelete && (
					<Button
						onClick={() => onDelete(media.id)}
						aria-label={`Delete ${media.title}`}
					>
						Delete
					</Button>
				)}
			</div>
		</article>
	);
};
