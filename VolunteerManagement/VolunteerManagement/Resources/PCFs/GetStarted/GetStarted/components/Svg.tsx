import * as React from 'react';

interface SvgProps {
	xml: string,
	className?: string
}

export const Svg = ({ xml, className }: SvgProps) => {
	return <span style={{ lineHeight: 1, display: 'inline-block' }} className={className} dangerouslySetInnerHTML={{ __html: xml }} />;
};
