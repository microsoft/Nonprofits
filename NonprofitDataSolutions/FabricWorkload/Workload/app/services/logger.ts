import { workloadTelemetryService } from '@services/telemetry';

enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
}

export class Logger {
	private _enabled: boolean;
	private _lastSearch: string = '';

	constructor() {
		this._enabled = false;
		this.refresh();
	}

	refresh = (): void => {
		if (typeof window === 'undefined') {
			return;
		}

		const currentSearch = window.location.search;
		if (currentSearch === this._lastSearch) {
			return;
		}

		this._lastSearch = currentSearch;
		const params = new URLSearchParams(currentSearch);
		this._enabled = process.env.DEBUG_MODE_ENABLED === 'true' ? true : params.get('debugMode') === 'true';
	};

	private _log = (level: LogLevel, icon: string, label: string, message: string, ...args: any[]): void => {
		// Always log warnings and errors, only log debug/info if debugMode is enabled
		const shouldLog = level >= LogLevel.WARN || this._enabled;

		if (!shouldLog) {
			return;
		}

		const prefix = `${icon} [${label}]`;

		switch (level) {
			case LogLevel.DEBUG:
				console.log(prefix, message, ...args);
				break;
			case LogLevel.INFO:
				console.info(prefix, message, ...args);
				break;
			case LogLevel.WARN:
				console.warn(prefix, message, ...args);
				break;
			case LogLevel.ERROR:
				console.error(prefix, message, ...args);

				const error = args.find((arg) => arg instanceof Error);
				workloadTelemetryService.trackEvent('ApplicationError', {
					operationName: 'Logger.Error',
					errorMessage: message,
					errorName: error?.name,
				});
				break;
		}
	};

	debug = (message: string, ...args: any[]): void => {
		this._log(LogLevel.DEBUG, '🐛', 'DEBUG', message, ...args);
	};

	info = (message: string, ...args: any[]): void => {
		this._log(LogLevel.INFO, 'ℹ️', 'INFO', message, ...args);
	};

	warn = (message: string, ...args: any[]): void => {
		this._log(LogLevel.WARN, '⚠️', 'WARN', message, ...args);
	};

	error = (message: string, ...args: any[]): void => {
		this._log(LogLevel.ERROR, '❌', 'ERROR', message, ...args);
	};

	isDebugMode = (): boolean => {
		return this._enabled;
	};
}

export const logger = new Logger();
