import * as React from 'react';
import { EngOppSummaryApp } from './EngOppSummaryApp';

interface IEngOppAppDataProviderProps {
	context: ComponentFramework.Context<any>;
}

import { EngOppSummaryAppProps } from './EngOppSummaryApp';

export class EngOppAppDataProvider extends React.Component<IEngOppAppDataProviderProps, EngOppSummaryAppProps> {
	constructor(props: IEngOppAppDataProviderProps) {
		super(props);

		this.state = {
			EngOppSchedules: [],
			Cancelled: 0,
			NoShow: 0,
			Confirmed: 0,
			NeedReview: 0,
			Countdown: 0,
			Closed: false,
		};
	}

	componentDidMount(): void {
		this.fetchState(this.props.context);
	}

	private fetchState = async (context: ComponentFramework.Context<any>) => {
		const engOppSchedules: ComponentFramework.WebApi.Entity[] = await this.getEngOppSchedules(context);
		const currentDate = new Date();
		const startDate = context.parameters.StartDate.raw || new Date();
		const diffDays = Math.ceil(
			(startDate.valueOf() - currentDate.valueOf()) / (1000 * 3600 * 24)
		);
		const status = context.parameters.EngOppStatus?.raw;
		let closed = false;
		if (status == 844060004 || status == 844060005) {
			closed = true;
		}

		this.setState({
			EngOppSchedules: engOppSchedules,
			Cancelled: context.parameters.CancelledShifts.raw || 0,
			NoShow: context.parameters.NoShowShifts.raw || 0,
			Confirmed: context.parameters.CompletedShifts.raw || 0,
			NeedReview: context.parameters.NeedsReview.raw || 0,
			Countdown: diffDays,
			Closed: closed,
		});
	};

	private async getEngOppSchedules(context:  ComponentFramework.Context<any>) {
		const id = 	context.parameters.EngOppId.raw;

		if (!id) return [];

		const today: Date = new Date(Date.now());
		today.setUTCHours(0, 0, 0, 0);
		let select = '?$select=_msnfp_engagementopportunity_value,msnfp_shiftname,msnfp_minimum,msnfp_number,';
		select += '&$filter=_msnfp_engagementopportunity_value eq ' + id + ' and msnfp_effectivefrom ge ' + today.toISOString();
		const results: ComponentFramework.WebApi.Entity[] = (
			await context.webAPI.retrieveMultipleRecords(
				'msnfp_engagementopportunityschedule',
				select
			)
		)?.entities;
		return results;
	}

	render() {
		return <EngOppSummaryApp {...this.state}/>;
	}
}
