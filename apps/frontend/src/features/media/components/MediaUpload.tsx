// MediaUpload Component

import React, { useRef, useState } from 'react';
import { CONFIG } from '../../../config';
import { Button } from '../../../ui/atoms/Button';
import { FormField } from '../../../ui/molecules/FormField';
import { formatFileSize } from '../../../utils';

export interface MediaUploadProps {
	onUpload: (file: File, title: string, description?: string) => Promise<void>;
	isLoading?: boolean;
	error?: string;
	className?: string;
}

export interface UploadFormData {
	title: string;
	description: string;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
	onUpload,
	isLoading = false,
	error,
	className = '',
}) => {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [formData, setFormData] = useState<UploadFormData>({
		title: '',
		description: '',
	});
	const [validationErrors, setValidationErrors] = useState<Partial<UploadFormData>>({});

	const uploadClasses = ['media-upload', className].filter(Boolean).join(' ');

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// Validate file size
			if (file.size > CONFIG.MEDIA.MAX_FILE_SIZE) {
				alert(`File size must be less than ${formatFileSize(CONFIG.MEDIA.MAX_FILE_SIZE)}`);
				return;
			}

			// Validate file type
			if (!CONFIG.MEDIA.ALLOWED_MIME_TYPES.includes(file.type)) {
				alert('File type not supported. Please select a valid audio or video file.');
				return;
			}

			setSelectedFile(file);
			// Auto-fill title if empty
			if (!formData.title) {
				setFormData((prev) => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, '') }));
			}
		}
	};

	const handleInputChange = (field: keyof UploadFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		// Clear validation error when user starts typing
		if (validationErrors[field]) {
			setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	const validateForm = (): boolean => {
		const errors: Partial<UploadFormData> = {};

		if (!formData.title.trim()) {
			errors.title = 'Title is required';
		}

		if (!selectedFile) {
			alert('Please select a file to upload');
			return false;
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
			await onUpload(
				selectedFile!,
				formData.title.trim(),
				formData.description.trim() || undefined,
			);
			// Reset form after successful upload
			setSelectedFile(null);
			setFormData({ title: '', description: '' });
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
		} catch (err) {
			// Error is handled by parent component
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		const file = e.dataTransfer.files[0];
		if (file) {
			const input = fileInputRef.current;
			if (input) {
				input.files = e.dataTransfer.files;
				handleFileSelect({ target: { files: e.dataTransfer.files } } as any);
			}
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
	};

	return (
		<div className={uploadClasses}>
			<div className='media-upload__header'>
				<h1>Upload Media</h1>
				<p>Share your audio and video files with the community.</p>
			</div>

			<form
				onSubmit={handleSubmit}
				className='media-upload__form'
				noValidate
			>
				{error && (
					<div
						className='media-upload__error'
						role='alert'
					>
						{error}
					</div>
				)}

				<div className='media-upload__file-section'>
					<div
						className='media-upload__drop-zone'
						onDrop={handleDrop}
						onDragOver={handleDragOver}
					>
						<input
							ref={fileInputRef}
							type='file'
							accept={CONFIG.MEDIA.ALLOWED_MIME_TYPES.join(',')}
							onChange={handleFileSelect}
							className='media-upload__file-input'
							id='media-file'
						/>
						<label
							htmlFor='media-file'
							className='media-upload__file-label'
						>
							{selectedFile ? (
								<div className='media-upload__file-selected'>
									<p>
										<strong>Selected File:</strong> {selectedFile.name}
									</p>
									<p>Size: {formatFileSize(selectedFile.size)}</p>
									<p>Type: {selectedFile.type}</p>
								</div>
							) : (
								<div className='media-upload__file-prompt'>
									<p>Click to select a file or drag and drop here</p>
									<p className='media-upload__file-hint'>
										Supported formats: MP4, WebM, OGG, MP3, WAV
									</p>
									<p className='media-upload__file-hint'>
										Max size: {formatFileSize(CONFIG.MEDIA.MAX_FILE_SIZE)}
									</p>
								</div>
							)}
						</label>
					</div>
				</div>

				<FormField
					label='Title'
					name='title'
					type='text'
					value={formData.title}
					onChange={(value) => handleInputChange('title', value)}
					placeholder='Enter media title'
					required
					error={validationErrors.title}
				/>

				<FormField
					label='Description'
					name='description'
					type='text'
					value={formData.description}
					onChange={(value) => handleInputChange('description', value)}
					placeholder='Enter media description (optional)'
				/>

				<div className='media-upload__actions'>
					<Button
						type='submit'
						variant='primary'
						size='large'
						disabled={isLoading || !selectedFile}
						className='media-upload__submit'
					>
						{isLoading ? 'Uploading...' : 'Upload Media'}
					</Button>
				</div>
			</form>
		</div>
	);
};
