import React from 'react';

import { useTranslation } from '@/i18n';
import { Button, Tooltip } from '@fluentui/react-components';
import { PersonArrowRight24Regular, SignOut24Regular } from '@fluentui/react-icons';

import { useAuth } from '@/hooks/useAuth';

import { useAuthButtonStyles } from './AuthButton.styles';

export const AuthButton: React.FC = () => {
	const styles = useAuthButtonStyles();
	const { user, isAuthenticated } = useAuth();
	const { t } = useTranslation();

	if (isAuthenticated && user) {
		return (
			<div className={styles.userContainer}>
				<span className={styles.userName}>
					{user.firstName} {user.lastName}
				</span>
				<Tooltip content={t('MSVE_SPA/Common/SignOut')} relationship="label">
					<Button
						icon={<SignOut24Regular />}
						appearance="subtle"
						onClick={async () => {
							await fetch('/Account/Login/LogOff', { credentials: 'same-origin' });
							window.location.href = '/';
						}}
					/>
				</Tooltip>
			</div>
		);
	}

	return (
		<Tooltip content={t('MSVE_SPA/Common/SignIn')} relationship="label">
			<Button
				icon={<PersonArrowRight24Regular />}
				appearance="subtle"
				onClick={() => {
					window.location.href = '/SignIn?returnUrl=/';
				}}
			/>
		</Tooltip>
	);
};
