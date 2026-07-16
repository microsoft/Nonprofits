import React from 'react';

import { Link, mergeClasses } from '@fluentui/react-components';

import { useFabricLinkStyles } from './FabricLink.styles';
import { FabricLinkProps } from './FabricLink.types';
import { FabricLinkOptions, useFabricLink } from './useFabricLink';

export const FabricLink: React.FC<FabricLinkProps> = ({
	children,
	className,
	ariaLabel: customAriaLabel,
	...props
}) => {
	const styles = useFabricLinkStyles();

	// Build options for useFabricLink hook
	const linkOptions: FabricLinkOptions =
		props.type === 'item'
			? {
					type: 'item' as const,
					itemType: props.itemType,
					itemId: props.itemId,
					workspaceId: props.workspaceId,
					openInNewTab: props.openInNewTab,
				}
			: { type: 'relative' as const, path: props.path };

	const { linkUrl, linkOnClick } = useFabricLink(linkOptions);

	const target =
		props.type === 'item' && props.openInNewTab ? '_blank' : props.type === 'relative' ? '_blank' : '_self';

	// Auto-generate aria-label for item links if not provided
	const ariaLabel =
		customAriaLabel || (props.type === 'item' ? `Navigate to ${props.itemType} ${props.itemId}` : undefined);

	return (
		<Link
			href={linkUrl}
			target={target}
			onClick={linkOnClick}
			className={mergeClasses(styles.link, className)}
			aria-label={ariaLabel}
		>
			{children}
		</Link>
	);
};
