import { makeStyles, tokens } from '@fluentui/react-components';

export const useDropdownStyles = makeStyles({
	optionContent: {
		display: 'flex',
		alignItems: 'center',
		gap: tokens.spacingHorizontalS,
	},
	iconWrapper: {
		display: 'flex',
		alignItems: 'center',
	},
});
