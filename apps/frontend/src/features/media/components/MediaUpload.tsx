// MediaUpload Component

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import React, { useRef, useState } from 'react';
import { File, Upload, X } from 'react-feather';
import { CONFIG } from '../../../config';
import { formatFileSize } from '../../../utils';

export interface MediaUploadProps {
	onUpload: (file: File, title: string, description?: string) => Promise<void>;
	isLoading?: boolean;
	error?: string;
	className?: string;
}

export interface UploadFormData {
	title: string;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({ onUpload, isLoading = false, error }) => {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [formData, setFormData] = useState<UploadFormData>({
		title: '',
	});
	const [validationErrors, setValidationErrors] = useState<Partial<UploadFormData>>({});
	const [uploadProgress, setUploadProgress] = useState(0);
	const [isUploading, setIsUploading] = useState(false);

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// Validate file type
			if (!CONFIG.MEDIA.ALLOWED_MIME_TYPES.includes(file.type as any)) {
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

		setIsUploading(true);
		setUploadProgress(0);

		// Simulate progress updates
		const progressInterval = setInterval(() => {
			setUploadProgress((prev) => {
				if (prev >= 90) {
					clearInterval(progressInterval);
					return 90;
				}
				return prev + Math.random() * 20;
			});
		}, 200);

		try {
			await onUpload(selectedFile!, formData.title.trim());

			// Complete the progress bar
			setUploadProgress(100);
			clearInterval(progressInterval);

			// Reset form after successful upload (if we reach here, upload succeeded)
			setSelectedFile(null);
			setFormData({ title: '' });
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
		} catch (err) {
			clearInterval(progressInterval);
			setUploadProgress(0);
			// Don't show error toast here - let useMedia hook handle it
		} finally {
			setIsUploading(false);
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
		<form
			onSubmit={handleSubmit}
			noValidate
			className='space-y-6'
		>
			{error && (
				<div
					className='p-3 bg-red-500/10 border border-red-500/20 rounded-md'
					role='alert'
				>
					<p className='text-red-500 text-sm'>{error}</p>
				</div>
			)}

			{/* File Upload Section */}
			<div className='space-y-2'>
				<Label
					htmlFor='media-file'
					className='text-white font-medium'
				>
					Select File
				</Label>
				<div
					className='border-2 border-dashed border-border/50 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer'
					onDrop={handleDrop}
					onDragOver={handleDragOver}
					onClick={() => fileInputRef.current?.click()}
				>
					<input
						ref={fileInputRef}
						type='file'
						accept={CONFIG.MEDIA.ALLOWED_MIME_TYPES.join(',')}
						onChange={handleFileSelect}
						className='hidden'
						id='media-file'
					/>
					{selectedFile ? (
						<div className='space-y-2'>
							<File className='w-8 h-8 text-primary mx-auto' />
							<div className='text-white'>
								<p className='font-medium'>{selectedFile.name}</p>
								<p className='text-sm text-white/70'>
									{formatFileSize(selectedFile.size)} • {selectedFile.type}
								</p>
							</div>
							<Button
								type='button'
								variant='outline'
								size='sm'
								onClick={(e) => {
									e.stopPropagation();
									setSelectedFile(null);
								}}
								className='border-red-500/50 text-red-500 hover:bg-red-500/10'
							>
								<X className='w-4 h-4 mr-1' />
								Remove
							</Button>
						</div>
					) : (
						<div className='space-y-2'>
							<Upload className='w-8 h-8 text-white/50 mx-auto' />
							<div className='text-white/80'>
								<p className='font-medium'>Click to select a file or drag and drop</p>
								<p className='text-sm text-white/60'>Supported: MP4, WebM, OGG, MP3, WAV</p>
								<p className='text-sm text-white/60'>Size limited by your storage plan</p>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Title Field */}
			<div className='space-y-2'>
				<Label
					htmlFor='title'
					className='text-white font-medium'
				>
					Title *
				</Label>
				<Input
					id='title'
					type='text'
					value={formData.title}
					onChange={(e) => handleInputChange('title', e.target.value)}
					placeholder='Enter media title'
					className='bg-background/60 border-border/50 text-white placeholder:text-white/50'
					required
				/>
				{validationErrors.title && <p className='text-red-500 text-sm'>{validationErrors.title}</p>}
			</div>

			{/* Upload Progress or Submit Button */}
			{isUploading ? (
				<div className='space-y-3'>
					<div className='flex items-center gap-2'>
						<div className='flex-1 bg-muted rounded-full h-2'>
							<div
								className='h-2 rounded-full transition-all duration-300 bg-primary'
								style={{
									width: `${uploadProgress}%`,
								}}
							/>
						</div>
						<span className='text-sm font-medium text-white'>{Math.round(uploadProgress)}%</span>
					</div>
					<p className='text-sm text-white/70 text-center'>Uploading your media...</p>
				</div>
			) : (
				<Button
					type='submit'
					disabled={isLoading || !selectedFile}
					className='w-full bg-primary hover:bg-primary/90 text-primary-foreground'
				>
					Upload Media
				</Button>
			)}
		</form>
	);
};
