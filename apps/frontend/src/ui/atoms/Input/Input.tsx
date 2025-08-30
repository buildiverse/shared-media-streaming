// Input Atom Component

import React from 'react';

export interface InputProps {
	type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	label?: string;
	name: string;
	id?: string;
	required?: boolean;
	disabled?: boolean;
	error?: string;
	className?: string;
	'aria-describedby'?: string;
}

export const Input: React.FC<InputProps> = ({
	type = 'text',
	value,
	onChange,
	placeholder,
	label,
	name,
	id,
	required = false,
	disabled = false,
	error,
	className = '',
	'aria-describedby': ariaDescribedby,
}) => {
	const inputId = id || name;
	const errorId = error ? `${inputId}-error` : undefined;

	return (
		<div>
			{label && (
				<label htmlFor={inputId}>
					{label}
					{required && <span aria-label='required'>*</span>}
				</label>
			)}
			<input
				type={type}
				id={inputId}
				name={name}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				required={required}
				disabled={disabled}
				className={className}
				aria-describedby={errorId || ariaDescribedby}
				aria-invalid={!!error}
				aria-required={required}
			/>
			{error && (
				<div
					id={errorId}
					role='alert'
				>
					{error}
				</div>
			)}
		</div>
	);
};
