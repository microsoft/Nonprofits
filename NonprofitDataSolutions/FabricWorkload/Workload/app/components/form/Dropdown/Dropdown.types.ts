import type { ReactElement } from 'react';

export interface DropdownOption {
	label: string;
	value: string;
}

export interface DropdownProps {
	label: string;
	options: DropdownOption[];
	value: string;
	onChange: (value: string) => void;
	validationState?: 'error' | 'warning' | 'success' | 'none';
	validationMessage?: string;
	required?: boolean;
	icon?: ReactElement;
	placeholder?: string;
	autoSelectFirst?: boolean;
}
