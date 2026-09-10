/**
 * @fileoverview Styles for test/development-only workspace move simulation panel.
 *
 * **For testing/development purposes only.**
 */

import { makeStyles, tokens } from '@fluentui/react-components';

export const useWorkspaceMoveSimulationPanelStyles = makeStyles({
	content: {
		display: 'flex',
		flexDirection: 'column',
		gap: tokens.spacingVerticalS,
	},
	label: {
		fontWeight: tokens.fontWeightSemibold,
	},
	grid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
		gap: tokens.spacingVerticalXXS,
	},
	actions: {
		display: 'flex',
		gap: tokens.spacingHorizontalS,
		marginTop: tokens.spacingVerticalXS,
	},
	previewSection: {
		display: 'flex',
		flexDirection: 'column',
		gap: tokens.spacingVerticalXXS,
	},
	preview: {
		margin: 0,
		padding: tokens.spacingHorizontalS,
		maxHeight: '260px',
		overflow: 'auto',
		whiteSpace: 'pre-wrap',
		wordBreak: 'break-word',
		backgroundColor: tokens.colorNeutralBackground2,
		borderRadius: tokens.borderRadiusMedium,
		fontFamily: tokens.fontFamilyMonospace,
		fontSize: tokens.fontSizeBase200,
	},
});
