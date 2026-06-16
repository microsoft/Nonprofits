import { useNavigate } from 'react-router-dom';

import { useTranslation } from '@/i18n';
import { Button, Text, Title1 } from '@fluentui/react-components';
import { Home24Regular, LockClosed48Regular } from '@fluentui/react-icons';

import { SignInButton } from '@/components/SignInButton';

import { useStyles } from './AccessDenied.styles';

export default function AccessDenied() {
	const styles = useStyles();
	const navigate = useNavigate();
	const { t } = useTranslation();

	return (
		<div className={styles.page}>
			<LockClosed48Regular className={styles.icon} />
			<Title1>{t('MSVE_SPA/AccessDenied/Title')}</Title1>
			<Text size={400} className={styles.mutedText}>
				{t('MSVE_SPA/AccessDenied/Message')}
			</Text>
			<div className={styles.actions}>
				<Button appearance="primary" icon={<Home24Regular />} onClick={() => navigate('/')}>
					{t('MSVE_SPA/Common/GoToHome')}
				</Button>
				<SignInButton />
			</div>
		</div>
	);
}
