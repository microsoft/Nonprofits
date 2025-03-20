import * as React from 'react';
import { Link, FontSizes, mergeStyleSets, FontWeights, useTheme } from '@fluentui/react';
import { DefaultPalette } from '@fluentui/theme';

export interface LinkOutBaseProps {
	title: string,
	description: string,
	linkTitle: string,
	linkAriaLabel?: string,
	link: string
}

export interface LinkOutProps extends LinkOutBaseProps {
	className?: string
}

export const LinkOut = ({ title, description, linkTitle, link, className, linkAriaLabel }: LinkOutProps) => {
	const { palette: { themePrimary = DefaultPalette.themePrimary, themeDark = DefaultPalette.themeDark, themeDarker = DefaultPalette.themeDarker } } = useTheme();

	const style = React.useMemo(() => mergeStyleSets({
		title: {
			fontSize: FontSizes.size16,
			marginBottom: '0.75rem',
			fontWeight: FontWeights.bold,
			lineHeight: '1.5',
			marginTop: 0
		},
		description: {
			fontSize: FontSizes.size14,
			margin: '0 0 0.75rem'
		},
		link: {
			color: themePrimary,
			textDecoration: 'none',
			':active': {
				color: themeDarker
			},
			':visited': {
				color: themeDarker
			},
			':hover': {
				color: themeDark
			},
			':focus': {
				color: themeDark
			},
		}
	}), [themePrimary, themeDark, themeDarker]);

	return (
		<div className={className}>
			<h2 className={style.title}>{title}</h2>
			<p className={style.description}>{description}</p>
			<Link target='_blank' className={style.link} href={link} aria-label={linkAriaLabel}>{linkTitle}</Link>
		</div>
	);
};
