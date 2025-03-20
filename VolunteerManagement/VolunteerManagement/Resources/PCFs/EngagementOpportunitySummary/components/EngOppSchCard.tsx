import * as React from 'react';
import { ProgressIndicator, Text, IStackItemStyles, StackItem, FontSizes } from '@fluentui/react';

export interface IEngOppSchCardPros {
	title: string,
	min: number | null,
	current: number,
	lightboldLabelStyle: React.CSSProperties
}
export class EngOppSchCard extends React.Component<IEngOppSchCardPros>{
	render(): JSX.Element {
		const percentComplete = this.props.min == null || this.props.min == 0 ? 1 : (this.props.current / this.props.min);
		const headerText = this.props.title.length < maxLength ? this.props.title : this.props.title.slice(0, maxLength) + '...';
		return (
			<StackItem styles={stackItemStyles}>
				<Text title={this.props.title} nowrap style={this.props.lightboldLabelStyle}>{headerText}</Text>
				<ProgressIndicator barHeight={4} label={this.ProgressLabel()} percentComplete={percentComplete} />
			</StackItem>
		);
	}

	ProgressLabel() {
		return (
			<Text>
				<span style={{ fontWeight: 600, fontSize: FontSizes.size28 }}>{this.props.current}</span>{"/" + (this.props.min || 0)}
			</Text>
		);
	}
}

const maxLength = 16;

const stackItemStyles: IStackItemStyles = {
	root: {
		width: 120,
	},
};
