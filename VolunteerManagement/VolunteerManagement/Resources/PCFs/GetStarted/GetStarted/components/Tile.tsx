import * as React from 'react';
import { NeutralColors } from '@fluentui/theme';
import { mergeStyleSets } from '@fluentui/react';

interface TileProps {
	className?: string
	children?: JSX.Element | JSX.Element[];
}

const style = mergeStyleSets({
	root: {
		boxShadow: '0px 0.3px 0.9px rgba(0, 0, 0, 0.1), 0px 1.6px 3.6px rgba(0, 0, 0, 0.13)',
		borderRadius: '0.25rem',
		background: NeutralColors.white,
		padding: '1.5rem 1rem',
		marginBottom: '2rem'
	}
});

export const Tile = ({ children, className = '' }: TileProps) => {
	return (<div className={`${style.root} ${className}`}> {children} </div>);
};
