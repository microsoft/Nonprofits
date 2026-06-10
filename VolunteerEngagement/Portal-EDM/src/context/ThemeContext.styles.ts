import { makeStyles } from '@fluentui/react-components';

export const useThemeContextStyles = makeStyles({
	provider: {
		flexGrow: 1,
		display: 'flex',
		flexDirection: 'column',
	},
	lightScheme: {
		colorScheme: 'light',
	},
	darkScheme: {
		colorScheme: 'dark',
	},
});
