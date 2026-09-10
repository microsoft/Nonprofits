import { makeStyles, tokens } from '@fluentui/react-components';

export const useSetupProgressCardStyles = makeStyles({
	content: {
		display: 'flex',
		flexDirection: 'column',
		gap: tokens.spacingVerticalM,
	},
	status: {
		display: 'flex',
		alignItems: 'center',
		gap: tokens.spacingHorizontalS,
	},
});
