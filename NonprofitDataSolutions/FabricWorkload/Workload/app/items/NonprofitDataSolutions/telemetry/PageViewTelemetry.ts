import { workloadTelemetryService } from '@services/telemetry';

// Single event name for all telemetry
const TELEMETRY_EVENT = 'PageView';

/**
 * Operation name for page view tracking
 */
const PAGE_VIEW_OPERATION = 'PageView';

export enum PageName {
	FundraisingDeploymentWizard = 'Fundraising.DeploymentWizard',
	FundraisingOverview = 'Fundraising.Overview',
	FundraisingDetails = 'Fundraising.Deployments',
	FundraisingPostDeploymentSetup = 'Fundraising.PostDeploymentSetup',
}

export interface PageViewTelemetryPayload {
	pageName: PageName;
	itemId: string;
	itemName: string;
	workspaceId?: string;
	workspaceName?: string;
	// Note: tenantId and userId are automatically included via telemetryService.commonProperties
}

function buildPageViewProperties(payload: PageViewTelemetryPayload) {
	return {
		operationName: PAGE_VIEW_OPERATION,
		pageName: payload.pageName,
		itemId: payload.itemId,
		itemName: payload.itemName,
		workspaceId: payload.workspaceId,
		workspaceName: payload.workspaceName,
	};
}

export function logPageView(payload: PageViewTelemetryPayload): void {
	workloadTelemetryService.trackEvent(TELEMETRY_EVENT, buildPageViewProperties(payload));
}
