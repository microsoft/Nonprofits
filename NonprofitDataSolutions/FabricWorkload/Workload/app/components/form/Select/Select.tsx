import type { ChangeEvent, FC } from 'react';

import { Field, Select as FluentSelect, useId } from '@fluentui/react-components';
import type { SelectOnChangeData } from '@fluentui/react-components';

import type { SelectProps } from './Select.types';

export const Select: FC<SelectProps> = ({
	label,
	options,
	value,
	onChange,
	validationState = 'none',
	validationMessage,
	required = false,
	icon,
	placeholder,
	disabled = false,
}) => {
	const selectId = useId();

	const handleChange = (_: ChangeEvent<HTMLSelectElement>, data: SelectOnChangeData) => {
		onChange(data.value);
	};

	return (
		<Field
			label={label}
			validationState={validationState}
			validationMessage={validationMessage}
			required={required}
		>
			<FluentSelect id={selectId} value={value} onChange={handleChange} icon={icon} disabled={disabled}>
				{placeholder && (
					<option value="" disabled>
						{placeholder}
					</option>
				)}
				{options.map((option, index) => (
					<option key={index} value={option.value}>
						{option.label}
					</option>
				))}
			</FluentSelect>
		</Field>
	);
};
