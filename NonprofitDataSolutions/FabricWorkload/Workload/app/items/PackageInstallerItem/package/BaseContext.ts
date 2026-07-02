import { ContextLogRecord } from './ContextLogRecord';

export class BaseContext {
	/** Map of variables available for substitution during deployment */
	variableMap: Record<string, string> = {};

	/** Collection of all log entries generated during deployment */
	private logs: ContextLogRecord[] = [];

	/**
	 * Logs an informational message to the console and deployment logs.
	 *
	 * @param message - The message to log (can be any type)
	 * @param optionalParams - Additional parameters to include in the log
	 *
	 * @example
	 * ```typescript
	 * context.log("Starting deployment process");
	 * context.log("Processing item:", itemName);
	 * ```
	 */
	log(message?: any, ...optionalParams: any[]): void {
		this.logInfo(message);
	}

	/**
	 * Logs an error message to the console and deployment logs.
	 *
	 * @param message - The error message to log (can be any type)
	 * @param optionalParams - Additional parameters to include in the error log
	 *
	 * @example
	 * ```typescript
	 * context.logError("Failed to create item", error);
	 * context.logError("Validation failed:", validationResults);
	 * ```
	 */
	logError(message?: any, ...optionalParams: any[]): void {
		logger.error(message, ...optionalParams);
		this.logs.push(new ContextLogRecord(message, 'error', optionalParams));
	}

	/**
	 * Logs a debug message to the console and deployment logs.
	 * Used for detailed diagnostic information during development.
	 *
	 * @param message - The debug message to log (can be any type)
	 * @param optionalParams - Additional parameters to include in the debug log
	 *
	 * @example
	 * ```typescript
	 * context.logDebug("Variable substitution:", variableMap);
	 * context.logDebug("Processing step", stepNumber, stepDetails);
	 * ```
	 */
	logDebug(message?: any, ...optionalParams: any[]): void {
		logger.debug(message, ...optionalParams);
		this.logs.push(new ContextLogRecord(message, 'debug', optionalParams));
	}

	/**
	 * Logs an informational message to the console and deployment logs.
	 * Used for general deployment status and progress information.
	 *
	 * @param message - The informational message to log (can be any type)
	 * @param optionalParams - Additional parameters to include in the info log
	 *
	 * @example
	 * ```typescript
	 * context.logInfo("Deployment started for package:", packageName);
	 * context.logInfo("Successfully created item:", itemId);
	 * ```
	 */
	logInfo(message?: any, ...optionalParams: any[]): void {
		logger.info(message, ...optionalParams);
		this.logs.push(new ContextLogRecord(message, 'info', optionalParams));
	}

	/**
	 * Retrieves all deployment logs as a formatted text string.
	 * Returns "no logs" if no logs are available.
	 *
	 * @returns Promise resolving to a string containing all log entries
	 *
	 * @example
	 * ```typescript
	 * const logText = await context.getLogText();
	 * console.log(logText);
	 * ```
	 */
	async getLogText(): Promise<string> {
		if (this.logs?.length === 0) {
			return '';
		}
		// Convert logs to a string format
		return this.logs.map((log) => log.toString()).join('\n');
	}
}
