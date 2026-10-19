export const getRibbonLabels = (displayName: string) => ({
	toolbarAriaLabel: `${displayName} item actions toolbar`,
	settingsButtonAriaLabel: `Open ${displayName.toLowerCase()} item settings`,
	deploymentButtonAriaLabel: `Open ${displayName.toLowerCase()} deployment wizard modal window and start deployment process`,
	deploymentButtonText: 'Start deployment',
});
