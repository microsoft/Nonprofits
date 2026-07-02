export interface TroubleshootingStep {
	id: string;
	number: string;
	title: string | React.ReactNode;
	buttonText: string;
}

export interface TroubleshootingData {
	title: string;
	steps: TroubleshootingStep[];
}

export const getTroubleshootingData = (
	troubleshootingLink: React.ReactNode,
	displayName: string,
): TroubleshootingData => ({
	title: 'Troubleshooting steps',
	steps: [
		{
			id: '01',
			number: '01',
			title: 'Review the deployment errors to identify what went wrong during the setup process.',
			buttonText: 'View deployment errors',
		},
		{
			id: '02',
			number: '02',
			title: 'Check your workspace permissions and ensure you have the necessary access rights.',
			buttonText: 'Check permissions',
		},
		{
			id: '03',
			number: '03',
			title: <>Review common deployment issues and their solutions in our {troubleshootingLink}.</>,
			buttonText: 'View troubleshooting',
		},
		{
			id: '04',
			number: '04',
			title: `Create a new ${displayName} item to retry the deployment process.`,
			buttonText: 'Retry deployment',
		},
	],
});
