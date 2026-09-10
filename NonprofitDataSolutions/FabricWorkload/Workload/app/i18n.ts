import { createInstance } from 'i18next';
import HttpApi from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

// Create a separate i18n instance to avoid conflicts with other libraries
const workloadI18n = createInstance();

workloadI18n
	.use(HttpApi)
	.use(initReactI18next)
	.init({
		fallbackLng: 'en-US',
		supportedLngs: ['en-US', 'es', 'he'],
		debug: false,
		// Add a unique namespace to avoid conflicts
		ns: ['workload'],
		defaultNS: 'workload',
		backend: {
			loadPath: '/assets/locales/{{lng}}/translation.json',
		},
		// Use a unique key separator to avoid conflicts
		keySeparator: '.',
		nsSeparator: ':',
		// React-specific options
		react: {
			useSuspense: false,
		},
	})
	.then(() => logger.info('i18n initialized'))
	.catch((error) => logger.error('i18n init failed:', error));

export default workloadI18n;
