import * as React from 'react';
import { IStackItemStyles,Stack, StackItem, Text, Link, Icon } from '@fluentui/react';
import { LocalizedStrings as strings } from '../strings';

export interface IStageCardProps {
	id:string,
	title: string,
	state: number,
	dueDate: Date,
	length: number,
	endDate: Date
	OpenQualification: (id: string) => void;
}
export class StageCard extends React.Component<IStageCardProps>{
	constructor(props: IStageCardProps){
		super(props);
		this.stageOnClick = this.stageOnClick.bind(this);
	}
	render(): JSX.Element{
		let subTitle = '';
		let color = '#0078d4';
		let borderColor = '#0078D4';
		if(this.props.state == StageStatus.Active && this.props.dueDate != null){
			const date = new Date(this.props.dueDate);
			subTitle = `${strings.stageSubTitleDue}: ${date.toLocaleDateString()}`;
			color = '#0078D4';
			borderColor = '#0078D4';
		}
		else if(this.props.state == StageStatus.Pending && this.props.length != null){
			subTitle = `${strings.stageSubTitleEstimated}: ${this.props.length.toString()} ${strings.days}`;
			color = '#A19F9D';
			borderColor = '#D2D0CE';
		}
		else if(this.props.state == StageStatus.Completed && this.props.endDate != null){
			const date = new Date(this.props.endDate);
			subTitle = `${strings.stageSubTitleCompleted}: ${date.toLocaleDateString()}`;
			color = '#ffffff';
			borderColor = '#0078D4';
		}
		const stackItemStyles: IStackItemStyles = {
			root: {
				width: 196,
				height: 70,
				padding: 16,
				margin: 5,
				borderWidth: 2,
				borderColor: borderColor,
				borderStyle: 'solid',
				boxSizing: 'border-box',
				backgroundColor: this.props.state == StageStatus.Completed ? '#0078D4' : ''
			},
		};
		const titleStyle: React.CSSProperties = {
			fontWeight: 600,
			fontSize: '14px',
			color: color,
		};
		const subTitleStyle: React.CSSProperties = {
			fontSize: '12px',
			color: color
		};
		const iconStyle: React.CSSProperties = {
			color: '#ffffff'
		};
		return(
			<Stack styles={stackItemStyles}>
				<StackItem  align="baseline" shrink={false} style={{padding:'5'}}>
					<Link nowrap onClick={this.stageOnClick} style={titleStyle}>{this.props.title}</Link>
					<Icon iconName="CheckMark" style={iconStyle}/>
				</StackItem>
				<StackItem align="baseline" shrink={false} style={{padding:'5'}}>
					<Text nowrap style={subTitleStyle} >{subTitle}</Text>
				</StackItem>
			</Stack>
		);
	}
	stageOnClick(){
		this.props.OpenQualification(this.props.id);
	}
}

enum StageStatus {
	Pending=844060000,
	Active=844060001,
	Completed=844060002,
	Abandon=844060003
}
