import React, { useState } from 'react';

import {
	Accordion,
	AccordionHeader,
	AccordionItem,
	AccordionPanel,
	Card,
	Divider,
	Text,
} from '@fluentui/react-components';
import { Warning24Regular } from '@fluentui/react-icons';

import { useErrorDetailsCardStyles } from './ErrorDetailsCard.styles';
import type { ErrorDetailsCardProps } from './ErrorDetailsCard.types';

export const ErrorDetailsCard: React.FC<ErrorDetailsCardProps> = ({ errorDetails }) => {
	const styles = useErrorDetailsCardStyles();
	const [openItems, setOpenItems] = useState<string[]>([]);

	if (!errorDetails) {
		return null;
	}

	// Generate dynamic title if item information is available
	const title =
		errorDetails.currentItemName && errorDetails.currentItemType
			? `Failed to create item '${errorDetails.currentItemName}' of type '${errorDetails.currentItemType}'`
			: 'Error details';

	return (
		<Card className={styles.errorCard}>
			<div className={styles.header}>
				<Warning24Regular className={styles.errorIcon} aria-hidden="true" />
				<Text className={styles.title}>{title}</Text>
			</div>
			<div className={styles.content}>
				<div className={styles.detailRow}>
					<Text className={styles.errorText}>{errorDetails?.errorMessage}</Text>
				</div>
				<Divider />
				<Accordion
					collapsible
					openItems={openItems}
					onToggle={(_, data) => setOpenItems(data.openItems as string[])}
				>
					<AccordionItem value="technical-details">
						<AccordionHeader size={'small'}>
							{openItems.includes('technical-details')
								? 'Hide technical details'
								: 'Show technical details'}
						</AccordionHeader>
						<AccordionPanel className={styles.detailPanel}>
							<div className={styles.detailRow} style={{ maxHeight: '200px', overflowY: 'auto' }}>
								<Text
									className={styles.errorText}
									style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}
								>
									{JSON.stringify(errorDetails, null, 2)}
								</Text>
							</div>
						</AccordionPanel>
					</AccordionItem>
				</Accordion>
			</div>
		</Card>
	);
};
