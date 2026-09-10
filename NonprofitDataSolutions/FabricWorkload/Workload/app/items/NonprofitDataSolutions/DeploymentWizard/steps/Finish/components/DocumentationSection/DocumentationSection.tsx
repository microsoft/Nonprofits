import React from 'react';

import { Link, Text } from '@fluentui/react-components';
import { Open20Regular } from '@fluentui/react-icons';

import { useExternalLink } from '@src/hooks/useExternalLink';

import { StepSection } from '@nds/DeploymentWizard/common';

import { useFinishStepStyles } from '../../Finish.styles';
import type { DocumentationLink, DocumentationSectionProps } from './DocumentationSection.types';

const DocumentationLinkItem: React.FC<{ link: DocumentationLink; openInNewTabLabel?: string }> = ({
	link,
	openInNewTabLabel,
}) => {
	const styles = useFinishStepStyles();
	const { url, onClick, handleKeyDown } = useExternalLink(link.url);

	return (
		<Link href={url} className={styles.documentationLinkItem} onClick={onClick} onKeyDown={handleKeyDown}>
			<Text>{link.title}</Text>
			<Open20Regular aria-label={openInNewTabLabel ?? 'Opens in new tab'} />
		</Link>
	);
};

export const DocumentationSection: React.FC<DocumentationSectionProps> = ({ links, labels }) => {
	const styles = useFinishStepStyles();

	return (
		<StepSection title={labels?.sectionTitle ?? 'Documentation'}>
			<div className={styles.documentationLinksContainer}>
				{links.map((link, index) => (
					<DocumentationLinkItem key={index} link={link} openInNewTabLabel={labels?.openInNewTabLabel} />
				))}
			</div>
		</StepSection>
	);
};
