import type { ApplicationInsights } from '@microsoft/applicationinsights-web';

type TelemetryPropertyValue = string | number | boolean | Date | undefined | null | Record<string, unknown>;
export type TelemetryProperties = Record<string, TelemetryPropertyValue>;

const MAX_PROPERTY_LENGTH = 2048;
const REDACTED_VALUE = '[redacted]';
const SENSITIVE_PROPERTY_NAME =
	/authorization|connectionstring|credential|password|passphrase|secret|token|api[-_]?key/i;

function normalizeString(value?: string): string | undefined {
	const normalizedValue = value?.trim();
	return normalizedValue ? normalizedValue : undefined;
}

function truncatePropertyValue(value: string): string {
	if (value.length <= MAX_PROPERTY_LENGTH) {
		return value;
	}

	return `${value.substring(0, MAX_PROPERTY_LENGTH)}...[truncated]`;
}

function normalizePropertyValue(value: TelemetryPropertyValue): string {
	if (value instanceof Date) {
		return value.toISOString();
	}

	if (typeof value === 'object') {
		try {
			return JSON.stringify(value);
		} catch {
			return '[unserializable]';
		}
	}

	return String(value);
}

function normalizeProperties(properties?: TelemetryProperties): Record<string, string> {
	if (!properties) {
		return {};
	}

	return Object.entries(properties).reduce<Record<string, string>>((accumulator, [key, value]) => {
		if (value === undefined || value === null) {
			return accumulator;
		}

		if (SENSITIVE_PROPERTY_NAME.test(key)) {
			accumulator[key] = REDACTED_VALUE;
			return accumulator;
		}

		accumulator[key] = truncatePropertyValue(normalizePropertyValue(value));
		return accumulator;
	}, {});
}

export interface TelemetryInitOptions {
	connectionString?: string;
	instrumentationKey?: string;
	disabled?: boolean;
	config?: {
		endpointUrl?: string;
	};
	commonProperties?: TelemetryProperties;
}

export class TelemetryService {
	private isInitialized = false;
	private commonProperties: Record<string, string> = {};
	private appInsights?: ApplicationInsights;

	async initialize(options: TelemetryInitOptions = {}): Promise<void> {
		if (this.isInitialized) {
			return;
		}

		this.isInitialized = true;
		if (options.commonProperties) {
			this.setCommonProperties(options.commonProperties);
		}

		if (options.disabled) {
			return;
		}

		const connectionString = normalizeString(options.connectionString);
		const instrumentationKey = normalizeString(options.instrumentationKey);

		if (!connectionString && !instrumentationKey) {
			return;
		}

		try {
			const { ApplicationInsights } = await import('@microsoft/applicationinsights-web');

			this.appInsights = new ApplicationInsights({
				config: {
					connectionString,
					instrumentationKey,
					endpointUrl: normalizeString(options.config?.endpointUrl),
					disableAjaxTracking: true,
					disableCookiesUsage: true,
					disableExceptionTracking: true,
					disableFetchTracking: true,
					enableAutoRouteTracking: false,
					maxBatchInterval: 1000,
				},
			});
			this.appInsights.loadAppInsights();
		} catch {
			this.appInsights = undefined;
		}
	}

	setCommonProperties(properties: TelemetryProperties): void {
		if (!properties) {
			return;
		}

		this.commonProperties = {
			...this.commonProperties,
			...normalizeProperties(properties),
		};
	}

	trackEvent(name: string, properties?: TelemetryProperties): void {
		if (!this.appInsights) {
			return;
		}

		try {
			this.appInsights.trackEvent(
				{ name },
				{
					...this.commonProperties,
					...normalizeProperties(properties),
				},
			);
		} catch {
			return;
		}
	}

	async flush(): Promise<void> {
		if (!this.appInsights) {
			return;
		}

		try {
			await Promise.resolve(this.appInsights.flush(true));
		} catch {
			return;
		}
	}
}

export const telemetryService = new TelemetryService();
