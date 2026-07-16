import React from 'react';

export interface ActionCardProps {
	icon: React.ComponentType<any>;
	title: string;
	description: string;
	buttonText?: string;
	link?: string;
}
