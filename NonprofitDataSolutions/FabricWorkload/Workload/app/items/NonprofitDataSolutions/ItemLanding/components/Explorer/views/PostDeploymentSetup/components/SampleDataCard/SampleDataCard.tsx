import type { FC } from 'react';

import { MessageBar, Text } from '@fluentui/react-components';

import { ContentCard } from '@src/items/NonprofitDataSolutions/ItemLanding/components/Explorer/components/ContentCard';

import type { SampleDataCardProps } from './SampleDataCard.types';
import { useSampleDataCardStyles } from './SampleDataCard.styles';

export const SampleDataCard: FC<SampleDataCardProps> = ({ sampleDataMissing, silverLakehouseResolved }) => {
	const styles = useSampleDataCardStyles();

	return (
		<ContentCard title="Sample data">
			{sampleDataMissing ? (
				<MessageBar intent={silverLakehouseResolved ? 'info' : 'warning'} layout="multiline">
					<div className={styles.content}>
						<Text>Sample data was originally installed but is not present in the current Silver lakehouse.</Text>
						{silverLakehouseResolved ? (
							<Text>It will be re-installed from the bundled package when you run setup.</Text>
						) : (
							<Text>Sample data cannot be re-installed because Silver lakehouse was not resolved.</Text>
						)}
					</div>
				</MessageBar>
			) : (
				<MessageBar intent="success">Sample data files are present in the current Silver lakehouse.</MessageBar>
			)}
		</ContentCard>
	);
};
