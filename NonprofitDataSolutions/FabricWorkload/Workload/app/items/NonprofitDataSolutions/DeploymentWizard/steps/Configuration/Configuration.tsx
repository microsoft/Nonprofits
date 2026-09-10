import React from 'react';

import { useNewConfigurationStyles } from './Configuration.styles';
import { BasicConfiguration, OptionalPackagesSection, RequiredPackagesSection } from './components';

export const Configuration: React.FC = () => {
	const styles = useNewConfigurationStyles();

	return (
		<div className={styles.container}>
			{/* Basic Configuration */}
			<BasicConfiguration />

			{/* Required Packages */}
			<RequiredPackagesSection />

			{/* Optional Packages */}
			<OptionalPackagesSection />
		</div>
	);
};

export default Configuration;
