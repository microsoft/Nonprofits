import { type FC, useEffect, useRef } from 'react';

import { Checkbox, Text, mergeClasses } from '@fluentui/react-components';

import { usePackageCardStyles } from './PackageCard.styles';
import type { PackageCardProps } from './PackageCard.types';

export const PackageCard: FC<PackageCardProps> = ({
	id,
	name,
	description,
	items,
	isSelected,
	isRequired = false,
	onClick,
}) => {
	const styles = usePackageCardStyles();
	const checkboxContainerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (checkboxContainerRef.current) {
			(checkboxContainerRef.current as any).inert = true;
		}
	}, []);

	const cardClassName = mergeClasses(
		styles.packageCard,
		isRequired && styles.requiredPackageCard,
		!isRequired && isSelected && styles.selectedPackageCard,
	);

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if ((event.key === 'Enter' || event.key === ' ') && onClick && !isRequired) {
			event.preventDefault();
			onClick();
		}
	};

	const ariaLabel = `${name} package. ${description}. ${
		isRequired ? 'Always included' : isSelected ? 'Selected' : 'Not selected'
	}`;

	return (
		<div
			key={id}
			className={cardClassName}
			onClick={onClick}
			onKeyDown={handleKeyDown}
			role="checkbox"
			tabIndex={isRequired ? -1 : 0}
			aria-label={ariaLabel}
			aria-checked={isSelected}
			aria-readonly={isRequired}
			aria-disabled={isRequired}
		>
			<div className={styles.packageContent}>
				<div ref={checkboxContainerRef} className={styles.checkboxContainer} aria-hidden="true">
					<Checkbox
						checked={isSelected || isRequired}
						disabled={isRequired}
						tabIndex={-1}
						role="presentation"
					/>
				</div>
				<div className={styles.packageInfo}>
					<div className={styles.packageDetails}>
						<Text className={styles.packageTitle} as="h4">
							{name}
						</Text>
						<Text className={styles.packageDescription}>{description}</Text>
					</div>
					<div className={styles.packageItems} role="group" aria-label={`Package components for ${name}`}>
						{items.map((item, idx) => (
							<div
								key={idx}
								className={mergeClasses(
									styles.packageItem,
									(isRequired || isSelected) && styles.selectedPackageItem,
								)}
							>
								{item}
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};
