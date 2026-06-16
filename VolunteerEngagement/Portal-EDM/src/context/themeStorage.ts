export enum ThemeMode {
	Light = 'light',
	Dark = 'dark',
}

const THEME_STORAGE_KEY = 've-theme';

export const getStoredThemeMode = (): ThemeMode => {
	try {
		return localStorage.getItem(THEME_STORAGE_KEY) === ThemeMode.Dark ? ThemeMode.Dark : ThemeMode.Light;
	} catch {
		return ThemeMode.Light;
	}
};

export const setStoredThemeMode = (mode: ThemeMode) => {
	try {
		localStorage.setItem(THEME_STORAGE_KEY, mode);
	} catch {
		// Theme persistence is optional when browser storage is unavailable.
	}
};
