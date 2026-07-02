import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useModuleStatusBadgeStyles = makeStyles({
	statusBadge: {
		display: 'inline-flex',
		alignItems: 'center',
		alignSelf: 'flex-start',
		gap: tokens.spacingHorizontalXS,
		fontSize: tokens.fontSizeBase200,
		fontWeight: tokens.fontWeightMedium,
		borderRadius: tokens.borderRadiusMedium,
		paddingLeft: tokens.spacingHorizontalSNudge,
		paddingRight: tokens.spacingHorizontalS,
		paddingTop: tokens.spacingVerticalXXS,
		paddingBottom: tokens.spacingVerticalXXS,
		minHeight: '24px',
		color: tokens.colorNeutralForeground1,
	},
	succeededColor: {
		color: tokens.colorStatusSuccessForeground1,
	},
	failedColor: {
		color: tokens.colorStatusDangerForeground1,
	},
	skippedColor: {
		color: tokens.colorNeutralForeground1,
	},
} satisfies Record<string, CSSProperties>);
