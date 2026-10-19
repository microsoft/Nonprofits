import type { FC } from 'react';

import { mergeClasses } from '@fluentui/react-components';

import { useShimmerStyles } from './Shimmer.styles';
import type { ShimmerProps } from './Shimmer.types';

export const Shimmer: FC<ShimmerProps> = ({ width, height, round, className }) => {
	const styles = useShimmerStyles();

	return (
		<div
			className={mergeClasses(styles.shimmer, round ? styles.round : undefined, className)}
			style={{ width, height }}
		/>
	);
};
