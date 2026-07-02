import { WorkloadClientAPI } from '@ms-fabric/workload-client';
import { History } from 'history';
import { Route, Router, Switch } from 'react-router-dom';

import { FabricProvider } from './context/FabricContext';
import { DeploymentWizard, ItemLanding } from './items/NonprofitDataSolutions';
import { DEPLOYMENT_WIZARD_ROUTE } from './items/NonprofitDataSolutions/DeploymentWizard/DeploymentWizard.model';
import { fundraisingConfig } from './items/NonprofitDataSolutions/ItemLanding/configs';
import { WorkloadItemProvider } from './items/NonprofitDataSolutions/ItemLanding/context/WorkloadItemContext';

/*
	Add your Item Editor in the Route section of the App function below
*/
interface AppProps {
	history: History;
	workloadClient: WorkloadClientAPI;
}

export interface PageProps {
	workloadClient: WorkloadClientAPI;
	history?: History;
}

export interface ContextProps {
	itemObjectId: string;
	pageId?: string;
	autostartwizard?: string;
}

export function App({ history, workloadClient }: AppProps) {
	return (
		<FabricProvider workloadClient={workloadClient}>
			<Router history={history}>
				<Switch>
					<Route path={fundraisingConfig.itemPageRoute}>
						<WorkloadItemProvider config={fundraisingConfig}>
							<ItemLanding />
						</WorkloadItemProvider>
					</Route>
					<Route path={DEPLOYMENT_WIZARD_ROUTE}>
						<DeploymentWizard />
					</Route>
				</Switch>
			</Router>
		</FabricProvider>
	);
}
