import React from 'react';

import { useTranslation } from '@/i18n';
import { Button } from '@fluentui/react-components';

import type { SignInButtonProps } from './SignInButton.types';

export const SignInButton: React.FC<SignInButtonProps> = ({ label, returnUrl = '/', className }) => {
	const { t } = useTranslation();
	return (
		<Button
			appearance="primary"
			onClick={() => {
				window.location.href = `/SignIn?returnUrl=${encodeURIComponent(returnUrl)}`;
			}}
			className={className}
		>
			{label ?? t('MSVE_SPA/Common/SignIn')}
		</Button>
	);
};
