import * as React from 'react';
import { mergeStyleSets, Stack } from '@fluentui/react';

import { Tile } from './Tile';
import { LinksBlock, LinksBlockProps } from './LinksBlock';
import { Svg } from './Svg';

export interface FeatureTileProps extends LinksBlockProps {
	svg: string,
	showImage?: boolean
}

export const FeatureTile = ({ svg, title, links, showImage = true }: FeatureTileProps) => {
	const style = React.useMemo(() => mergeStyleSets({
		column: {
			flex: 1,
			position: 'relative'
		},
		imageColumn: {
			minHeight: '270px'
		},
		image: {
			position: 'absolute',
			top: '50%',
			left: '50%',
			width: '102%',
			height: 'auto',
			transform: 'translate(-50%, -50%)',
			'& svg': {
				width: '102%',
				height: 'auto'
			}
		},
		linksBlock: {
			paddingLeft: showImage ? '1.5rem' : 'initial'
		}
	}), [showImage]);

	return (
		<Tile>
			<Stack horizontal>
				{showImage &&
					<Stack.Item className={`${style.column} ${style.imageColumn}`}>
						<Svg xml={svg} className={style.image} />
					</Stack.Item>
				}
				<Stack.Item className={`${style.column} ${style.linksBlock}`}>
					<LinksBlock title={title} links={links} />
				</Stack.Item>
			</Stack>
		</Tile>
	);
};
