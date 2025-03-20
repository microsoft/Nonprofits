import * as React from 'react';
import { Stack, initializeIcons } from '@fluentui/react';

import { StageCard } from './StageCard';

initializeIcons();

export interface OnboardingStagesAppProps{
	disabled: boolean;
	Stages: ComponentFramework.WebApi.Entity[]
	OpenQualification: (id:string) => void;
	currentStage: ComponentFramework.LookupValue[];
}
export interface OnboardingStagesAppState{
	Processing:boolean;
}

export class OnboardingStagesApp extends React.Component<OnboardingStagesAppProps, OnboardingStagesAppState>{
	constructor(props: OnboardingStagesAppProps) {
		super(props);
	}

	render(): JSX.Element {
		return (
			<Stack wrap horizontal horizontalAlign="baseline" style={{ marginLeft: '-25px '}}>
				<br/>
				{this.Stages()}
				<br/>
			</Stack>
		);
	}

	Stages(){
		return this.props.Stages.map((stage, i) => {
			return (<StageCard key={i} id={stage?.msnfp_qualificationstageid} title={stage?.msnfp_stagename ?? ''} state={stage?.msnfp_stagestatus ?? true} dueDate={stage?.msnfp_duedate} length={stage?.msnfp_plannedlengthdays ?? 0} endDate={stage?.msnfp_completiondate} OpenQualification={this.props.OpenQualification}/>);
		});
	}
}
