import * as React from 'react';

import { IStackTokens, Stack, StackItem, FontSizes, FontWeights, Text, initializeIcons, Label } from '@fluentui/react';

import { EngOppSchCard } from './EngOppSchCard';
import { SummaryCard } from './SummaryCard';
import { LocalizedStrings } from '../EngagementOpportunitySummary/strings';

initializeIcons();

export interface EngOppSummaryAppProps {
	EngOppSchedules: ComponentFramework.WebApi.Entity[] //{msnfp_shiftname:string,msnfp_number:number,msnfp_minimum:number}[];
	Cancelled: number;
	NoShow: number;
	Confirmed: number;
	NeedReview: number;
	Countdown: number;
	Closed: boolean;
}
export class EngOppSummaryApp extends React.Component<EngOppSummaryAppProps> {
	render(): JSX.Element {
		return (
			<Stack wrap horizontal horizontalAlign="baseline" tokens={themedExtraLargeStackTokens}>
				{this.Statuses(this.props.Closed)}
			</Stack>
		);
	}

	Statuses(closedStatus: boolean) {
		if (closedStatus) {
			return (
				<Stack wrap horizontalAlign="baseline" horizontal tokens={themedExtraLargeStackTokens}>
					{this.Schedules()}
					<SummaryCard title={LocalizedStrings.titleCancelled} number={this.props.Cancelled} iconName="EventDeclined" lightboldLabelStyle={lightboldLabelStyle} boldLabelStyle={boldLabelStyle} themedSmallStackTokens={themedSmallStackTokens} />
					<SummaryCard title={LocalizedStrings.titleNoShow} number={this.props.NoShow} iconName="EventTentative" lightboldLabelStyle={lightboldLabelStyle} boldLabelStyle={boldLabelStyle} themedSmallStackTokens={themedSmallStackTokens} />
					<SummaryCard title={LocalizedStrings.titleConfirmed} number={this.props.Confirmed} iconName="TimeEntry" lightboldLabelStyle={lightboldLabelStyle} boldLabelStyle={boldLabelStyle} themedSmallStackTokens={themedSmallStackTokens} />
				</Stack>
			);
		}
		else {
			return (
				<Stack wrap horizontal tokens={themedExtraLargeStackTokens}>
					{this.Schedules()}
					<SummaryCard title={LocalizedStrings.titleReview} number={this.props.NeedReview} iconName="ReminderPerson" lightboldLabelStyle={lightboldLabelStyle} boldLabelStyle={boldLabelStyle} themedSmallStackTokens={themedSmallStackTokens} />
					<SummaryCard title={LocalizedStrings.titleCancelled} number={this.props.Cancelled} iconName="EventDeclined" lightboldLabelStyle={lightboldLabelStyle} boldLabelStyle={boldLabelStyle} themedSmallStackTokens={themedSmallStackTokens} />
					<StackItem id="CountDownSection">
						<StackItem align="baseline" shrink={false}>
							<Text nowrap style={lightboldLabelStyle}>{LocalizedStrings.titleCountdown}</Text>
						</StackItem>
						<Stack horizontal tokens={themedSmallStackTokens} wrap={false}>
							<StackItem align="center" >
								<Label style={boldLabelStyle}>{this.props.Countdown}</Label>
							</StackItem>
							<StackItem align="baseline" >
								<Label> {LocalizedStrings.days}</Label>
							</StackItem>
						</Stack>
					</StackItem>
				</Stack>
			);
		}
	}

	Schedules() {
		return this.props.EngOppSchedules.map((schedule, i) => {
			return (<EngOppSchCard key={i} title={schedule?.msnfp_shiftname ?? ''}
				min={schedule?.msnfp_minimum ?? 0} current={schedule?.msnfp_number ?? 0} lightboldLabelStyle={lightboldLabelStyle} />);
		});
	}
}

const themedExtraLargeStackTokens: IStackTokens = {
	childrenGap: '40',
	padding: '40',
};

const themedSmallStackTokens: IStackTokens = {
	childrenGap: '5',
	padding: '5',
};

const boldLabelStyle: React.CSSProperties = {
	fontWeight: FontWeights.semibold,
	fontSize: FontSizes.size28
};

const lightboldLabelStyle: React.CSSProperties = {
	fontWeight: FontWeights.semibold,
};
