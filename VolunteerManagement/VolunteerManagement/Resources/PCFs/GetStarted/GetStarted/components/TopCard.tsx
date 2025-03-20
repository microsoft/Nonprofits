import * as React from 'react';
import { FontWeights, FontSizes, IIconProps, mergeStyleSets, ActionButton, useTheme } from '@fluentui/react';
import { NeutralColors } from '@fluentui/theme';

import { Tile } from './Tile';
import { Svg } from './Svg';

export interface TopCardProps {
	icon: string,
	title: string,
	link: string,
	linkText: string
}

const fileIcon: IIconProps = { iconName: 'TextDocument' };

export const TopCard = ({ icon, title, link, linkText }: TopCardProps) => {
	const { palette: { neutralDark, themePrimary, themeDark } } = useTheme();

	const actionButtonStyles = React.useMemo(() => ({
		icon: {
			color: neutralDark
		},
		iconHovered: {
			color: neutralDark
		},
		label: {
			color: themePrimary
		},
		labelHovered: {
			color: themeDark,
			textDecoration: 'underline'
		}
	}), [neutralDark, themePrimary, themeDark]);

	const style = React.useMemo(() => mergeStyleSets({
		root: {
			backgroundColor: NeutralColors.white,
			height: '180px',
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'flex-start',
			justifyContent: 'space-between'
		},
		icon: {
			width: '48px',
			height: '48px'
		},
		title: {
			fontSize: FontSizes.size14,
			fontWeight: FontWeights.semibold,
			color: NeutralColors.gray190,
			paddingBottom: '0.5rem',
			margin: 0
		},
		button: {
			padding: '0.5rem 0.5rem 0.5rem 0.25rem',
			marginBottom: '-0.75rem',
			'&:focus span': {
				color: themeDark
			}
		}
	}), [neutralDark]);

	return (
		<Tile className={style.root}>
			<div><Svg xml={icon} aria-role='presentation'/></div>
			<h2 className={style.title}>{title}</h2>
			<ActionButton
				text={linkText}
				styles={actionButtonStyles}
				role='link'
				iconProps={fileIcon}
				className={style.button}
				ariaLabel={`${title} ${linkText}`}
				onClickCapture={() => window.open(link)}
			/>
		</Tile>
	);
};
