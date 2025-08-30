// Button Atom Component

import React from 'react';

export interface ButtonProps {
	children: React.ReactNode;
	type?: 'button' | 'submit' | 'reset';
	variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
	size?: 'small' | 'medium' | 'large';
	disabled?: boolean;
	onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
	className?: string;
	id?: string;
	'aria-label'?: string;
}

export const Button: React.FC<ButtonProps> = ({
	children,
	type = 'button',
	variant = 'primary',
	size = 'medium',
	disabled = false,
	onClick,
	className = '',
	id,
	'aria-label': ariaLabel,
}) => {
	return (
		<button
			type={type}
			className={className}
			disabled={disabled}
			onClick={onClick}
			id={id}
			aria-label={ariaLabel}
			aria-disabled={disabled}
		>
			{children}
		</button>
	);
};
