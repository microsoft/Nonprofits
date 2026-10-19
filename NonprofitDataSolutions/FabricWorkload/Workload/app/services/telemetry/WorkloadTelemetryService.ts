import { WorkloadClientAPI } from '@ms-fabric/workload-client';

import { TelemetryService } from './TelemetryService';
import { extractTelemetryContext } from './TokenHelper';

function isTelemetryDisabled(): boolean {
	return process.env.TELEMETRY_DISABLED?.toLowerCase() !== 'false';
}

class WorkloadTelemetryService extends TelemetryService {
	async initializeForWorkload(workloadClient: WorkloadClientAPI): Promise<void> {
		try {
			const telemetryContext = await extractTelemetryContext(workloadClient);

			await this.initialize({
				connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
				instrumentationKey: process.env.APPLICATIONINSIGHTS_INSTRUMENTATION_KEY,
				disabled: isTelemetryDisabled(),
				config: {
					endpointUrl: process.env.APPLICATIONINSIGHTS_ENDPOINT_URL,
				},
				commonProperties: {
					workloadName: process.env.WORKLOAD_NAME ?? 'unknown',
					...telemetryContext,
				},
			});
		} catch {
			try {
				await this.initialize({
					disabled: true,
					commonProperties: {
						workloadName: process.env.WORKLOAD_NAME ?? 'unknown',
					},
				});
			} catch {
				return;
			}
		}
	}
}

export const workloadTelemetryService = new WorkloadTelemetryService();
