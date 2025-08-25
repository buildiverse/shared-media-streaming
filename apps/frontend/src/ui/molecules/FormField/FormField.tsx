// FormField Molecule Component

import React from 'react';
import { Input, InputProps } from '../../atoms/Input';
import { Label } from '../../atoms/Label';

export interface FormFieldProps extends Omit<InputProps, 'label'> {
	label: string;
	description?: string;
	className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
	label,
	description,
	className = '',
	...inputProps
}) => {
	return (
		<div className={className}>
			<Label
				htmlFor={inputProps.id || inputProps.name}
				required={inputProps.required}
			>
				{label}
			</Label>
			{description && <p id={`${inputProps.id || inputProps.name}-description`}>{description}</p>}
			<Input
				{...inputProps}
				aria-describedby={
					description ? `${inputProps.id || inputProps.name}-description` : undefined
				}
			/>
		</div>
	);
};
