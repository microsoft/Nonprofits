import { Text } from '@fluentui/react-components';

import { useSectionContainerStyles } from './SectionContainer.styles';
import { SectionContainerProps } from './SectionContainer.types';

export const SectionContainer: React.FC<SectionContainerProps> = ({ title, titleId, children, className }) => {
	const styles = useSectionContainerStyles();
	const sectionId = titleId || `section-${title.toLowerCase().replace(/\s+/g, '-')}`;

	return (
		<section className={`${styles.section} ${className || ''}`} aria-labelledby={sectionId}>
			<Text as="h2" block className={styles.sectionTitle} id={sectionId}>
				{title}
			</Text>
			<div className={styles.content}>{children}</div>
		</section>
	);
};
