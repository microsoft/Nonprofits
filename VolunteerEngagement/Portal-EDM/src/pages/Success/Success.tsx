import { useNavigate, useSearchParams } from 'react-router-dom';

import { useTranslation } from '@/i18n';
import { Button, Text, Title1 } from '@fluentui/react-components';
import { ArrowLeft24Regular, CheckmarkCircle48Regular, Home24Regular } from '@fluentui/react-icons';

import { useStyles } from './Success.styles';

export default function Success() {
	const styles = useStyles();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const action = searchParams.get('action') ?? 'apply';
	const { t } = useTranslation();

	const messages: Record<string, { title: string; description: string }> = {
		apply: {
			title: t('MSVE_SPA/Success/ApplyTitle'),
			description: t('MSVE_SPA/Success/ApplyMessage'),
		},
		cancel: {
			title: t('MSVE_SPA/Success/CancelTitle'),
			description: t('MSVE_SPA/Success/CancelMessage'),
		},
	};

	const msg = messages[action] ?? messages.apply;

	return (
		<div className={styles.page}>
			<CheckmarkCircle48Regular className={styles.icon} />
			<Title1>{msg.title}</Title1>
			<Text size={400} className={styles.description}>
				{msg.description}
			</Text>
			<div className={styles.actions}>
				<Button appearance="primary" icon={<Home24Regular />} onClick={() => navigate('/')}>
					{t('MSVE_SPA/Common/BrowseEngagements')}
				</Button>
				<Button appearance="subtle" icon={<ArrowLeft24Regular />} onClick={() => navigate('/my-engagements')}>
					{t('MSVE_SPA/Nav/MyEngagements')}
				</Button>
			</div>
		</div>
	);
}
