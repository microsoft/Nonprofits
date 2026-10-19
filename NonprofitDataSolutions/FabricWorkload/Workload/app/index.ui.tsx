import { StrictMode } from 'react';

import { FluentProvider } from '@fluentui/react-components';
import { InitParams, ItemTabActionContext, createWorkloadClient } from '@ms-fabric/workload-client';
import { createBrowserHistory } from 'history';
import { createRoot } from 'react-dom/client';

import { workloadTelemetryService } from '@services/telemetry';

import { ExceptionOperation, logException } from '@nds/telemetry/ExceptionTelemetry';

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
				const correlationId =
					typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
						? crypto.randomUUID()
						: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
				console.error(`React render failed (correlationId: ${correlationId}):`, error);
				logException({
					name: ExceptionOperation.UiRenderFailed,
					error,
					additionalProperties: { referenceId: correlationId },
				});

				const container = document.createElement('div');
				container.style.padding = '20px';
				container.style.color = 'red';
				const heading = document.createElement('h2');
				heading.textContent = 'Something went wrong while loading this page.';
				const message = document.createElement('p');
				message.textContent =
					'Please refresh the page and try again. If the problem continues, contact your administrator and include the reference ID below.';
				const reference = document.createElement('p');
				reference.textContent = `Reference ID: ${correlationId}`;
				container.append(heading, message, reference);
				rootElement.replaceChildren(container);
			}
		}
	});
}
