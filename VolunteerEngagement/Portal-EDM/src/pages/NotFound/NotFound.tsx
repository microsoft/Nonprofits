import { useNavigate } from 'react-router-dom';

import { useTranslation } from '@/i18n';
import { Button, Text, Title1 } from '@fluentui/react-components';
import { Home24Regular } from '@fluentui/react-icons';

import { useStyles } from './NotFound.styles';

export default function NotFound() {
	const styles = useStyles();
	const navigate = useNavigate();
	const { t } = useTranslation();

	return (
		<div className={styles.page}>
			<div className={styles.code} aria-hidden="true">
				404
			</div>
			<Title1 as="h1">{t('MSVE_SPA/NotFound/Title')}</Title1>
			<Text size={400} className={styles.mutedText}>
				{t('MSVE_SPA/NotFound/Message')}
			</Text>
			<Button appearance="primary" icon={<Home24Regular />} onClick={() => navigate('/')}>
				{t('MSVE_SPA/Common/GoToHome')}
			</Button>
		</div>
	);
}
