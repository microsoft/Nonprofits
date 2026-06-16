export interface NavItemDef {
	text: string;
	path: string;
	activePaths?: string[];
	requiresAuth?: boolean;
}
