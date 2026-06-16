import React from 'react';

import { mergeClasses } from '@fluentui/react-components';

import { useHeroBannerStyles } from './HeroBanner.styles';
import type { HeroBannerProps } from './HeroBanner.types';

export const HeroBanner: React.FC<HeroBannerProps> = ({ title, subtitle, icon, className, children }) => {
	const styles = useHeroBannerStyles();

	return (
		<div className={mergeClasses(styles.hero, className)}>
			{icon}
			{subtitle && <span className={styles.subtitle}>{subtitle}</span>}
			<h1 className={styles.title}>{title}</h1>
			{children}
		</div>
	);
};
