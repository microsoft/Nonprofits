import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { FluentProvider, webDarkTheme, webLightTheme } from '@fluentui/react-components';

import { useThemeContextStyles } from './ThemeContext.styles';
import { ThemeMode, getStoredThemeMode, setStoredThemeMode } from './themeStorage';

interface ThemeContextType {
	mode: ThemeMode;
	toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
};

interface ThemeProviderProps {
	children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
	const styles = useThemeContextStyles();
	const [mode, setMode] = useState<ThemeMode>(getStoredThemeMode);

	useEffect(() => {
		setStoredThemeMode(mode);
		if (mode === ThemeMode.Dark) {
			document.documentElement.classList.add('ve-dark');
		} else {
			document.documentElement.classList.remove('ve-dark');
		}
	}, [mode]);

	const toggleTheme = () => {
		setMode((prev) => (prev === ThemeMode.Light ? ThemeMode.Dark : ThemeMode.Light));
	};

	const theme = mode === ThemeMode.Light ? webLightTheme : webDarkTheme;

	return (
		<ThemeContext.Provider value={{ mode, toggleTheme }}>
			<FluentProvider
				theme={theme}
				className={`${styles.provider} ${mode === ThemeMode.Light ? styles.lightScheme : styles.darkScheme}`}
			>
				{children}
			</FluentProvider>
		</ThemeContext.Provider>
	);
};
