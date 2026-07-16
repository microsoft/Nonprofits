/**
 * Represents a single log record entry during deployment operations.
 * Contains timestamp, message, log level, and optional parameters.
 */
export class ContextLogRecord {
	/** The timestamp when this log record was created */
	date: Date;

	/**
	 * Creates a new deployment log record.
	 * @param message - The log message content
	 * @param level - The severity level of the log entry ("info", "debug", or "error")
	 * @param params - Additional parameters or context data for the log entry
	 */
	constructor(
		public message: string,
		public level: 'info' | 'debug' | 'error',
		public params: any[],
	) {
		this.date = new Date();
	}

	/**
	 * Formats the log record as a string for display or storage.
	 * @returns A string representation of the log record
	 */
	toString(): string {
		return `[${this.date.toISOString()}] [${this.level.toUpperCase()}] ${this.message} ${JSON.stringify(this.params)}`;
	}
}
