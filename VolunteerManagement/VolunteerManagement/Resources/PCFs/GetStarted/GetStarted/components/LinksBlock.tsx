import * as React from 'react';
import { FontWeights, DefaultPalette } from '@fluentui/theme';
import { mergeStyleSets, FontSizes, Link, useTheme} from '@fluentui/react';

export interface LinksBlockProps {
	title: string,
	links: {
		href: string,
		title: string
	}[]
}

export const LinksBlock = ({ links, title }: LinksBlockProps) => {
	const { palette: { themePrimary = DefaultPalette.themePrimary, themeDark = DefaultPalette.themeDarker, themeDarker = DefaultPalette.themeDarker } } = useTheme();

	const style = React.useMemo(() => mergeStyleSets({
		linkWrapper: {
			listStyle: 'disc outside none',
			marginBottom: '1.25rem',
			paddingLeft: '0.4rem',
			'&:last-child': {
				marginBottom: 0
			}
		},
		linkList: {
			paddingLeft: '1.5rem',
			marginTop: '1.25rem'
		},
		title: {
			fontSize: FontSizes.size16,
			fontWeight: FontWeights.semibold,
			lineHeight: '1.5',
			margin: 0
		},
		link: {
			fontSize: FontSizes.size14,
			color: themePrimary,
			lineHeight: '1.25rem',
			textDecoration: 'none',
			':focus': {
				color: themeDark
			},
			':active': {
				color: themeDarker
			},
			':visited': {
				color: themeDarker
			},
			':hover': {
				color: themeDark
			}
		}
	}), [themePrimary, themeDark, themeDarker]);

	return (
		<div>
			<h2 className={style.title}>{title}</h2>
			<ul aria-label={title} className={style.linkList}>
				{links.map((link, i) => <li className={style.linkWrapper} key={i}><Link target='_blank' className={style.link} href={link.href}>{link.title}</Link></li>)}
			</ul>
		</div>
	);
};
