import { useCallback } from 'react';

export interface UseDownloadJsonOptions {
	/** Number of spaces for JSON indentation (default: 4) */
	indent?: number;
}

/**
 * Custom hook for downloading objects as JSON files in the browser.
 * Works within sandboxed iframes by using data URLs.
 *
 * @param options - Configuration options for JSON formatting
 * @returns A function that downloads the provided object as a JSON file
 *
 * @example
 * ```tsx
 * const downloadJson = useDownloadJson();
 *
 * const handleExport = () => {
 *   downloadJson(myData, 'export-data.json');
 * };
 * ```
 */
export const useDownloadJson = (options: UseDownloadJsonOptions = {}) => {
	const { indent = 4 } = options;

	const downloadJson = useCallback(
		<T = any>(data: T, fileName: string) => {
			if (!data) {
				logger.warn('No data for download');
				return;
			}

			try {
				// Serialize object to JSON with specified indentation
				const jsonString = JSON.stringify(data, null, indent);

				// Create data URL (works in sandboxed iframes)
				const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(jsonString)}`;

				// Create and trigger download
				const link = document.createElement('a');
				link.href = dataUrl;
				link.download = fileName;
				link.style.display = 'none';

				document.body.appendChild(link);
				link.click();

				// Cleanup with delay
				setTimeout(() => {
					document.body.removeChild(link);
				}, 100);
			} catch (error) {
				logger.error('Download JSON failed:', error);
				throw error;
			}
		},
		[indent],
	);
	return downloadJson;
};
