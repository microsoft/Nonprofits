import * as React from 'react';

import { IInputs } from '../generated/ManifestTypes';
import { OnboardingStagesApp } from './OnboardingStagesApp';

interface IProps {
	context: ComponentFramework.Context<IInputs>;
}

interface IState {
	isLoading: boolean;
	stages: ComponentFramework.WebApi.Entity[];
}

export class OnboardingStagesDataProvider extends React.Component<IProps, IState> {
	constructor(props: IProps) {
		super(props);

		this.state = {
			isLoading: true,
			stages: [],
		};
	}

	async componentDidMount() {
		console.log('fetch !!!');
		const stages = await this.getStages(this.props.context.parameters.EntityId.raw);

		this.setState({
			stages,
			isLoading: false
		});
	}

	public openQualificationStage = (id: string) => {
		const options:ComponentFramework.NavigationApi.EntityFormOptions = {
			entityName:'msnfp_qualificationstage',
			entityId:id,
			windowPosition:2
		};

		this.props.context.navigation.openForm(options);
	};

	private async getStages(id: string | null) {
		if (!id) return [];
		let select = '?$select=msnfp_stagename,msnfp_stagestatus,msnfp_duedate,msnfp_plannedlengthdays,msnfp_completiondate,msnfp_sequencenumber&$filter=_msnfp_qualificationid_value eq ';
		select += id + '&$orderby=msnfp_sequencenumber';
		const results: ComponentFramework.WebApi.Entity[] = (
			await this.props.context.webAPI.retrieveMultipleRecords(
				'msnfp_qualificationstage',
				select
			)
		)?.entities;

		return results;
	}

	render() {
		return !this.state.isLoading && (
			<OnboardingStagesApp
				Stages={this.state.stages}
				OpenQualification={this.openQualificationStage}
				disabled={this.props.context.mode.isControlDisabled}
				currentStage={this.props.context.parameters.CurrentStage.raw}
			/>
		);
	}
}
