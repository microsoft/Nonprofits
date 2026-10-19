import type { ReactElement } from 'react';

export interface InputProps {
	label: string;
	value: string;
	icon?: ReactElement;
	placeholder?: string;
	validationState?: 'error' | 'warning' | 'success' | 'none';
	validationMessage?: string;
	required?: boolean;
	disabled?: boolean;
	type?: 'text' | 'email' | 'password' | 'tel' | 'url';
	onChange?: (value: string) => void;
}
