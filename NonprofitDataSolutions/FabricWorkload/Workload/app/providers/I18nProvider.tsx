import { I18nextProvider } from 'react-i18next';

import workloadI18n from '../i18n';

interface I18nProviderProps {
	children: React.ReactNode;
}

/**
 * Custom I18n Provider that wraps the application with our isolated i18n instance
 * This prevents conflicts with other libraries that might use i18n
 */
export const WorkloadI18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
	return <I18nextProvider i18n={workloadI18n}>{children}</I18nextProvider>;
};
