import { useEffect } from 'react';
import type { FC } from 'react';

import { Field, Dropdown as FluentDropdown, Option, useId } from '@fluentui/react-components';
import type { OptionOnSelectData, SelectionEvents } from '@fluentui/react-components';

import { useDropdownStyles } from './Dropdown.styles';
import type { DropdownProps } from './Dropdown.types';

// Helper component for option content with icon
const OptionContent: FC<{ icon?: React.ReactElement; text: string }> = ({ icon, text }) => {
	const styles = useDropdownStyles();
	return (
		<div className={styles.optionContent}>
			{icon && <span className={styles.iconWrapper}>{icon}</span>}
			<span>{text}</span>
		</div>
	);
};

export const Dropdown: FC<DropdownProps> = ({
	label,
	options,
	value,
	onChange,
	validationState = 'none',
	validationMessage,
	required = false,
	icon,
	placeholder = 'Select an option...',
	autoSelectFirst = false,
}) => {
	const dropdownId = useId();

	// Automatically select the first option if no value is set and options are available
	useEffect(() => {
		if (autoSelectFirst && !value && options.length > 0) {
			onChange(options[0].value);
		}
	}, [autoSelectFirst, options, value, onChange]);

	const handleChange = (_: SelectionEvents, data: OptionOnSelectData) => {
		if (data.optionValue !== undefined) {
			onChange(data.optionValue);
		}
	};

	// Get the display text for the selected value
	const selectedOption = options.find((option) => option.value === value);
	const displayText = selectedOption ? selectedOption.label : '';

	// Create custom button content with icon
	const buttonContent = selectedOption && icon && <OptionContent icon={icon} text={displayText} />;

	return (
		<Field
			label={label}
			validationState={validationState}
			validationMessage={validationMessage}
			required={required}
		>
			<FluentDropdown
				id={dropdownId}
				value={displayText}
				button={buttonContent}
				selectedOptions={value ? [value] : []}
				onOptionSelect={handleChange}
				placeholder={placeholder}
			>
				{options.map((option) => (
					<Option key={option.value} value={option.value} text={option.label}>
						<OptionContent icon={icon} text={option.label} />
					</Option>
				))}
			</FluentDropdown>
		</Field>
	);
};
