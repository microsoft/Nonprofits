import React from 'react';

import { useTranslation } from '@/i18n';
import { Button, Tooltip } from '@fluentui/react-components';
import { WeatherMoon24Regular, WeatherSunny24Regular } from '@fluentui/react-icons';

import { useTheme } from '@/context/ThemeContext';
import { ThemeMode } from '@/context/themeStorage';

export const ThemeToggle: React.FC = () => {
	const { mode, toggleTheme } = useTheme();
	const { t } = useTranslation();

	return (
		<Tooltip
			content={mode === ThemeMode.Light ? t('MSVE_SPA/Common/SwitchToDark') : t('MSVE_SPA/Common/SwitchToLight')}
			relationship="label"
		>
			<Button
				icon={mode === ThemeMode.Light ? <WeatherMoon24Regular /> : <WeatherSunny24Regular />}
				appearance="subtle"
				onClick={toggleTheme}
			/>
		</Tooltip>
	);
};
