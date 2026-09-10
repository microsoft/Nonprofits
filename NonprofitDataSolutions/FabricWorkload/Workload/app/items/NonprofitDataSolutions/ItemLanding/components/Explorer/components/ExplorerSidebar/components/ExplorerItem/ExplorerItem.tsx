import { Button, Text, mergeClasses } from '@fluentui/react-components';

import { useExplorerItemStyles } from './ExplorerItem.styles';
import { ExplorerItemProps } from './ExplorerItem.types';

export const ExplorerItem: React.FC<ExplorerItemProps> = (props) => {
	const styles = useExplorerItemStyles();
	const { id, label, description, icon: IconComponent, isSelected, onItemSelect } = props;

	return (
		<Button
			key={id}
			appearance="transparent"
			className={mergeClasses(styles.navigationItem, isSelected && styles.navigationItemSelected)}
			onClick={() => onItemSelect?.(props)}
			aria-current={isSelected ? 'page' : undefined}
			aria-describedby={description ? `nav-desc-${id}` : undefined}
		>
			<div className={styles.navigationItemContent}>
				<IconComponent
					className={mergeClasses(styles.navigationItemIcon, isSelected && styles.navigationItemIconSelected)}
					aria-hidden="true"
				/>
				<Text className={styles.navigationItemLabel}>{label}</Text>
				{description && (
					<span id={`nav-desc-${id}`} className={styles['sr-only']}>
						{description}
					</span>
				)}
			</div>
		</Button>
	);
};
