// Label Atom Component

import React from 'react';

export interface LabelProps {
	children: React.ReactNode;
	htmlFor?: string;
	required?: boolean;
	className?: string;
	id?: string;
}

export const Label: React.FC<LabelProps> = ({
	children,
	htmlFor,
	required = false,
	className = '',
	id,
}) => {
	return (
		<label
			htmlFor={htmlFor}
			className={className}
			id={id}
		>
			{children}
			{required && <span aria-label='required'>*</span>}
		</label>
	);
};
