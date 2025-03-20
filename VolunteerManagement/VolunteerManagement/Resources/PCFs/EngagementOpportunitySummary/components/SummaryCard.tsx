import * as React from 'react';

import { Text, Label, Stack, StackItem, IStackItemStyles, IStackTokens, mergeStyles, FontIcon } from '@fluentui/react';

export interface ISummaryCardProps {
	title: string,
	number: number,
	iconName: string,
	boldLabelStyle: React.CSSProperties,
	lightboldLabelStyle: React.CSSProperties,
	themedSmallStackTokens: IStackTokens
}

export class SummaryCard extends React.Component<ISummaryCardProps> {
	render(): JSX.Element {
		return (
			<StackItem styles={stackItemStyles}>
				<StackItem align="baseline" shrink={false} style={{ padding: '5', margin: '5' }}>
					<Text nowrap style={this.props.lightboldLabelStyle}>{this.props.title}</Text>
				</StackItem>
				<Stack horizontal tokens={this.props.themedSmallStackTokens} verticalAlign="center" wrap={false}>
					<Label style={this.props.boldLabelStyle}>{this.props.number}</Label>
					<FontIcon role="presentation" iconName={this.props.iconName} className={iconClass} />
				</Stack>
			</StackItem>
		);
	}
}

const iconClass = mergeStyles({
	fontSize: 30,
	height: 30,
	width: 30,
	margin: '0 25px',
});

const stackItemStyles: IStackItemStyles = {
	root: {
		width: 120,
	},
};
