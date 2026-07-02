import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useAdditionalConfigurationStyles = makeStyles({
	// Main container
	container: {
		display: 'flex',
		flexDirection: 'column',
		gap: tokens.spacingVerticalXXL,
		margin: '0',
		padding: '0',
	},

	// Introduction section
	introSection: {
		display: 'flex',
		flexDirection: 'column',
		gap: tokens.spacingVerticalXS,
		margin: '0',
		padding: '0',
	},

	sectionTitle: {
		fontSize: tokens.fontSizeBase400,
		fontWeight: tokens.fontWeightSemibold,
		color: tokens.colorNeutralForeground1,
		margin: '0',
		padding: '0',
	},

	sectionDescription: {
		fontSize: tokens.fontSizeBase300,
		color: tokens.colorNeutralForeground2,
		lineHeight: tokens.lineHeightBase300,
		margin: '0',
		padding: '0',
	},

	// Integration sections
	integrationSection: {
		display: 'flex',
		flexDirection: 'column',
		gap: tokens.spacingVerticalL,
		margin: '0',
		padding: '0',
	},

	// Form fields (used in main component for StepDropdown wrapper)
	fieldRow: {
		display: 'flex',
		flexDirection: 'column',
		gap: tokens.spacingVerticalXS,
		margin: '0',
		padding: '0',
	},

	fieldDescription: {
		fontSize: tokens.fontSizeBase200,
		color: tokens.colorNeutralForeground2,
		margin: '0',
		padding: '0',
		lineHeight: tokens.lineHeightBase200,
	},
} satisfies Record<string, CSSProperties>);
