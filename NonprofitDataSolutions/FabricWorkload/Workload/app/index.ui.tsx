import { StrictMode } from 'react';

import { FluentProvider } from '@fluentui/react-components';
import { InitParams, ItemTabActionContext, createWorkloadClient } from '@ms-fabric/workload-client';
import { createBrowserHistory } from 'history';
import { createRoot } from 'react-dom/client';

import { workloadTelemetryService } from '@services/telemetry';

import { App } from './App';
import { callGetItem } from './controller/ItemCRUDController';
import { WorkloadI18nProvider } from './providers/I18nProvider';
import { fabricLightTheme } from './theme';

export async function initialize(params: InitParams) {
	console.log('🚀 UI initialization started with params:', params);

	const workloadClient = createWorkloadClient();
	console.log('✅ WorkloadClient created successfully');

	await workloadTelemetryService.initializeForWorkload(workloadClient);

	const history = createBrowserHistory();

	workloadClient.action.onAction(async function ({ action, data }) {
		const { id } = data as ItemTabActionContext;
		switch (action) {
			case 'item.tab.onInit':
				try {
					const itemResult = await callGetItem(workloadClient, id);
					return { title: itemResult.displayName };
				} catch (error) {
					console.error(`Error loading the Item (object ID:${id})`, error);
					return {};
				}
			case 'item.tab.canDeactivate':
				return { canDeactivate: true };
			case 'item.tab.onDeactivate':
				return {};
			case 'item.tab.canDestroy':
				return { canDestroy: true };
			case 'item.tab.onDestroy':
				return {};
			case 'item.tab.onDelete':
				return {};
			default:
				throw new Error('Unknown action received');
		}
	});

	const rootElement = document.getElementById('root');

	if (!rootElement) {
		console.error('Root element not found');
		document.body.innerHTML = '<div style="padding: 20px; color: red;">❌ Error: Root element not found</div>';
		return;
	}

	let isRendered = false;

	workloadClient.navigation.onNavigate((route) => {
		history.replace(route.targetUrl);
		logger.refresh();

		// Render React only on first navigation event
		if (!isRendered) {
			isRendered = true;

			try {
				const root = createRoot(rootElement);

				root.render(
					<StrictMode>
						<WorkloadI18nProvider>
							<FluentProvider theme={fabricLightTheme}>
								<App history={history} workloadClient={workloadClient} />
							</FluentProvider>
						</WorkloadI18nProvider>
					</StrictMode>,
				);
			} catch (error) {
				const err = error as Error;
				console.error('React render failed:', err);
				rootElement.innerHTML = `
					<div style="padding: 20px; color: red; font-family: monospace;">
						<h2>❌ React Rendering Error</h2>
						<p>Error: ${err.message}</p>
						<pre>${err.stack}</pre>
					</div>
				`;
			}
		}
	});
}
