import * as React from 'react';
import { NeutralColors } from '@fluentui/theme';
import { ThemeProvider, mergeStyleSets } from '@fluentui/react';

import {
	Tile,
	LinkOut,
	TopCard,
	PageHeader,
	LinksBlock,
	FeatureTile
} from './';

import { useIsUpToLargeScreen } from '../hooks/breakpoints';
import { getActivitiesProps, getDocumentationProps, getPageHeaderProps, getLearnProps, getLinkOuts } from '../controller';

const theme = {
	palette: {
		themePrimary: '#742774',
		themeDark: '#672367',
		themeDarker: '#3F153F',
		neutralDark: NeutralColors.gray160
	}
};

const GetStartedPage = () => {
	const isLargeScreen = !useIsUpToLargeScreen();

	const style = React.useMemo(() => mergeStyleSets({
		container: {
			maxWidth: '1012px',
			padding: '0 2rem 2rem',
			marginLeft: 'auto',
			marginRight: 'auto'
		},
		pageLayout: {
			backgroundColor: NeutralColors.gray10,
			color: theme.palette.neutralDark,
			textAlign: 'initial',
			'& *': {
				boxSizing: 'border-box'
			}
		},
		topTileStack: {
			display: 'flex',
			flexWrap: 'wrap',
			marginLeft: '-0.5rem',
			marginRight: '-0.5rem',
			topTileStack: {
				'& > :not(:first-child)': {
					marginTop: 0
				}
			}
		},
		topTileContainer: {
			paddingLeft: '0.5rem',
			paddingRight: '0.5rem',
			flex: `0 0 ${isLargeScreen ? '33.3%' : '100%'}`
		},
		linkOutContainer: {
			flex: `0 0 ${isLargeScreen ? '33.3%' : '100%'}`,
			padding: isLargeScreen ? '0 3.75rem 2.25rem 0' : '0 1rem 2.25rem'
		},
		linkOutBlock: {
			marginBottom: '-2.25rem',
			display: 'flex',
			flexWrap: 'wrap'
		}
	}), [isLargeScreen]);

	return (
		<ThemeProvider theme={theme} >
			<div className={style.pageLayout}>
				<PageHeader {...getPageHeaderProps()} />
				<div className={style.container}>
					<div className={style.topTileStack}>
						{getActivitiesProps().map((activity, i) => <div className={style.topTileContainer}><TopCard {...activity}/></div>)}
					</div>
					<FeatureTile {...getDocumentationProps()} showImage={isLargeScreen}></ FeatureTile>
					<Tile>
						<LinksBlock {...getLearnProps()} />
					</Tile>
					<Tile>
						<div className={style.linkOutBlock}>
							{getLinkOuts().map((linkOut, i) => <div className={style.linkOutContainer}><LinkOut key={i} {...linkOut}/></div>)}
						</div>
					</Tile>
				</div>
			</div>
		</ThemeProvider>
	);
};

export default GetStartedPage;
