import React from 'react';

// Function to get icon component for a given item type using local SVG files
export function getItemTypeIcon(
	itemType: string,
	width: number = 32,
	height: number = 32,
	className?: string,
): React.JSX.Element {
	const getIconPath = (iconName: string): string => {
		return `/assets/icons/${iconName}_32_item.svg`;
	};

	let iconPath: string;

	switch (itemType.toLowerCase()) {
		case 'notebook':
			iconPath = getIconPath('notebook');
			break;
		case 'report':
			iconPath = getIconPath('report');
			break;
		case 'semanticmodel':
		case 'semantic model':
			iconPath = getIconPath('semantic_model');
			break;
		case 'lakehouse':
			iconPath = getIconPath('lakehouse');
			break;
		case 'warehouse':
			iconPath = getIconPath('data_warehouse');
			break;
		case 'kqldatabase':
		case 'kql database':
			iconPath = getIconPath('kql_database');
			break;
		case 'kqlqueryset':
		case 'kql queryset':
			iconPath = getIconPath('kql_queryset');
			break;
		case 'kqldashboard':
		case 'kql dashboard':
		case 'realtimedashboard':
		case 'real-time dashboard':
			iconPath = getIconPath('real_time_dashboard');
			break;
		case 'datapipeline':
		case 'data pipeline':
			iconPath = getIconPath('pipeline');
			break;
		case 'dataflow':
		case 'dataflow gen2':
			iconPath = getIconPath('dataflow');
			break;
		case 'mlmodel':
		case 'ml model':
			iconPath = getIconPath('model');
			break;
		case 'mlexperiment':
		case 'ml experiment':
			iconPath = getIconPath('experiments');
			break;
		case 'sparkjobdefinition':
		case 'spark job definition':
			iconPath = getIconPath('spark_job_direction');
			break;
		case 'environment':
			iconPath = getIconPath('environment');
			break;
		case 'eventstream':
		case 'event stream':
			iconPath = getIconPath('eventstream');
			break;
		case 'dashboard':
			iconPath = getIconPath('dashboard');
			break;
		default:
			iconPath = getIconPath('report'); // Using report as default
			break;
	}

	return React.createElement('img', {
		src: iconPath,
		alt: itemType,
		width: width,
		height: height,
		className: className,
		style: {
			display: 'inline-block',
			verticalAlign: 'middle',
		},
	});
}

// Generic function to get any icon from local assets
export function getIcon(
	iconName: string,
	width: number = 20,
	height: number = 20,
	className?: string,
): React.JSX.Element {
	const iconPath = `/assets/icons/${iconName}.svg`;

	return React.createElement('img', {
		src: iconPath,
		alt: iconName,
		width: width,
		height: height,
		className: className,
		style: {
			display: 'inline-block',
			verticalAlign: 'middle',
		},
	});
}

export function getItemTypeLabel(itemType: string): string {
	switch (itemType?.toLowerCase()) {
		case 'semanticmodel':
			return 'Semantic model';

		case 'datapipeline':
		case 'data pipeline':
			return 'Pipeline';
	}

	return itemType;
}
