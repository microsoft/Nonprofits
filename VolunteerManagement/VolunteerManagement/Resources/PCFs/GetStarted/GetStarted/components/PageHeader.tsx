import * as React from 'react';
import { NeutralColors } from '@fluentui/theme';
import { mergeStyleSets, Text, FontSizes } from '@fluentui/react';

export interface PageHeaderProps {
	pageTitle: string;
	pageSubTitle: string;
	styles?: {
		container?: string;
	}
}

const style = mergeStyleSets({
	root: {
		marginBottom: '2rem',
		background: NeutralColors.white,
		color: NeutralColors.gray160
	},
	headerInner: {
		height: '180px',
		padding: '0 2rem',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'flex-end',
		alignItems: 'center',
		textAlign: 'center',
		color: NeutralColors.gray160
	},
	pageTitle: {
		fontSize: FontSizes.size32,
		marginBottom: '0.25rem'
	},
	pageSubTitle: {
		fontSize: FontSizes.size16,
		marginBottom: '1.5rem',
	}
});

export const PageHeader = ({ pageTitle, pageSubTitle, styles = {} }: PageHeaderProps) => {
	return (
		<header className={style.root}>
			<div className={`${style.headerInner} ${styles.container}`}>
				<h1 className={style.pageTitle}>{pageTitle}</h1>
				<Text className={style.pageSubTitle}>{pageSubTitle}</Text>
			</div>
		</header>
	);
};
