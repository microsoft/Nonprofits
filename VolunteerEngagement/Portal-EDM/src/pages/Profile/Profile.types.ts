export enum ProfileTab {
	Info = 'info',
	Availability = 'availability',
	PreferencesAndQualifications = 'prefsquals',
}

export const PATH_TO_TAB: Record<string, ProfileTab> = {
	'/profile': ProfileTab.Info,
	'/profile-availability': ProfileTab.Availability,
	'/profile-prefandqual': ProfileTab.PreferencesAndQualifications,
};

export const TAB_TO_PATH: Record<ProfileTab, string> = {
	[ProfileTab.Info]: '/profile',
	[ProfileTab.Availability]: '/profile-availability',
	[ProfileTab.PreferencesAndQualifications]: '/profile-prefandqual',
};
