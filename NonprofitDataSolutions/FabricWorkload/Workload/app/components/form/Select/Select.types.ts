import type { ReactElement } from 'react';

export interface SelectOption {
	label: string;
	value: string;
}

export interface SelectProps {
	label: string;
	options: SelectOption[];
	value: string;
	onChange: (value: string) => void;
	validationState?: 'error' | 'warning' | 'success' | 'none';
	validationMessage?: string;
	required?: boolean;
	icon?: ReactElement;
	placeholder?: string;
	disabled?: boolean;
}
