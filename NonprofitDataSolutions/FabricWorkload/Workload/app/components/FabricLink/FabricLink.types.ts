import type { ReactNode } from 'react';

export type FabricLinkProps = FabricItemLinkProps | FabricRelativeLinkProps;

export interface FabricItemLinkProps {
	/** Link type - item navigation */
	type: 'item';
	/** Fabric item type */
	itemType: string;
	/** Fabric item ID */
	itemId: string;
	/** Workspace ID */
	workspaceId: string;
	/** Link content */
	children: ReactNode;
	/** Whether to open in new tab (default: false for in-app navigation) */
	openInNewTab?: boolean;
	/** Additional CSS class name */
	className?: string;
	/** Accessibility label (optional, auto-generated if not provided) */
	ariaLabel?: string;
}

export interface FabricRelativeLinkProps {
	/** Link type - relative path (always opens in new tab) */
	type: 'relative';
	/** Relative path from hostOrigin */
	path: string;
	/** Link content */
	children: ReactNode;
	/** Additional CSS class name */
	className?: string;
	/** Accessibility label (optional) */
	ariaLabel?: string;
}
