import React, { createContext, useMemo } from 'react';

import type ExtendedWindow from '@/ExtendedWindow';

import { fallbackStrings } from './fallback';

export interface LanguageInfo {
	code: string;
	name: string;
	url: string;
}

export interface LocaleContextValue {
	locale: string;
	languages: LanguageInfo[];
	t: (key: string, params?: Record<string, string | number>) => string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const LocaleContext = createContext<LocaleContextValue>({
	locale: 'en-US',
	languages: [],
	t: (key) => fallbackStrings[key] ?? key,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
	const value = useMemo<LocaleContextValue>(() => {
		const win = window as unknown as ExtendedWindow;
		const strings: Record<string, string> = win.__VE_STRINGS ?? fallbackStrings;
		const locale: string = win.__VE_LOCALE ?? 'en-US';
		const languages: LanguageInfo[] = win.__VE_LANGUAGES ?? [];

		const t = (key: string, params?: Record<string, string | number>): string => {
			let str = strings[key] ?? fallbackStrings[key] ?? key;
			if (params) {
				for (const [k, v] of Object.entries(params)) {
					str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
				}
			}
			return str;
		};

		return { locale, languages, t };
	}, []);

	return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
