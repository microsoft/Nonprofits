import React from 'react';

import { useTranslation } from '@/i18n';
import { Button, Menu, MenuItem, MenuList, MenuPopover, MenuTrigger, Tooltip } from '@fluentui/react-components';
import { Globe24Regular } from '@fluentui/react-icons';

import { useLanguagePickerStyles } from './LanguagePicker.styles';

export const LanguagePicker: React.FC = () => {
	const styles = useLanguagePickerStyles();
	const { locale, languages, t } = useTranslation();

	if (languages.length < 2) return null;

	return (
		<Menu>
			<MenuTrigger disableButtonEnhancement>
				<Tooltip content={t('MSVE_SPA/Nav/ChangeLanguage')} relationship="label">
					<Button
						icon={<Globe24Regular />}
						appearance="subtle"
						aria-label={t('MSVE_SPA/Nav/ChangeLanguage')}
					/>
				</Tooltip>
			</MenuTrigger>
			<MenuPopover>
				<MenuList>
					{languages.map((lang) => (
						<MenuItem
							key={lang.code}
							onClick={() => {
								window.location.href = lang.url;
							}}
							aria-current={lang.code === locale ? 'page' : undefined}
							className={lang.code === locale ? styles.activeMenuItem : undefined}
						>
							{lang.name}
						</MenuItem>
					))}
				</MenuList>
			</MenuPopover>
		</Menu>
	);
};
