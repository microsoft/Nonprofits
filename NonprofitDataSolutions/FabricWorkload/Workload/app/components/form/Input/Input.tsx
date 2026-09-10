import type { ChangeEvent, FC } from 'react';

import { Field, Input as FluentInput, useId } from '@fluentui/react-components';
import type { InputOnChangeData } from '@fluentui/react-components';

import type { InputProps } from './Input.types';

export const Input: FC<InputProps> = ({
	label,
	value,
	icon,
	onChange,
	placeholder,
	validationState = 'none',
	validationMessage,
	required = false,
	type = 'text',
	disabled = false,
}) => {
	const inputId = useId();

	const handleChange = (_: ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => {
		onChange && onChange(data.value);
	};

	return (
		<Field
			label={label}
			validationState={validationState}
			validationMessage={validationMessage}
			required={required}
		>
			<FluentInput
				id={inputId}
				value={value}
				onChange={handleChange}
				placeholder={placeholder}
				type={type}
				disabled={disabled}
				contentBefore={icon}
			/>
		</Field>
	);
};
