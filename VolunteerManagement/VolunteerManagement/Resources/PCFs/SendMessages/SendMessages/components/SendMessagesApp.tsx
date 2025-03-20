import * as React from 'react';
import { DefaultButton, IIconProps, Stack, initializeIcons, IStackTokens, StackItem } from '@fluentui/react';

import { SendMessagePanel, SendMessagePanelState } from './SendMessagePanel';
import { LocalizedStrings } from '../strings';

initializeIcons();
export interface SendMessagesAppProps {
	disabled: boolean;
	WebApi: ComponentFramework.WebApi;
	entityType: string;
	entityId: string;
	userId: string;
	userFullName: string;
}
export interface SendMessagesAppState {
	isPanelOpen:boolean;
	isProcessing:boolean;
	showErrorOnPanelLoad: boolean;
}

export class SendMessagesApp extends React.Component<SendMessagesAppProps, SendMessagesAppState> {
	constructor(props: SendMessagesAppProps){
		super(props);

		this.state = {
			isPanelOpen:false,
			isProcessing:false,
			showErrorOnPanelLoad: false
		};
	}

	showPanel = (isPanelOpen: boolean) => {
		this.setState({ isPanelOpen });
	};

	render():JSX.Element{
		return (
			<Stack tokens={stackTokens} style={{marginLeft: 'auto'}}>
				<StackItem align="end">
					<DefaultButton text={this.props.entityType == 'Group'? LocalizedStrings.messageGroup : LocalizedStrings.messageParticipants} iconProps={addIcon} onClick={()=> this.showPanel(true)} />
				</StackItem>
				<SendMessagePanel isPanelOpen={this.state.isPanelOpen} isProcessing={this.state.isProcessing} updateView={this.showPanel} onSave={this.onSave} showErrorOnLoad={this.state.showErrorOnPanelLoad} entityType={this.props.entityType} userFullName={this.props.userFullName}/>
			</Stack>
		);
	}

	onSave = async (saveData: SendMessagePanelState) => {
		if(saveData.message == '' || saveData.subject == '')
		{
			this.setState({showErrorOnPanelLoad:true});
			return;
		}
		this.setState({isProcessing:true});

		if(this.props.entityType == 'Group'){
			const entities:ComponentFramework.WebApi.RetrieveMultipleResponse = await this.props.WebApi.retrieveMultipleRecords('msnfp_groupmembership',('?$select=_msnfp_contactid_value,_msnfp_groupid_value&$filter=_msnfp_groupid_value eq '+ this.props.entityId));
			this.createBccMessage(saveData.message,saveData.subject,this.props.userId,entities.entities as ComponentFramework.WebApi.Entity[], this.props.entityId, '');
		}
		else if(this.props.entityType == 'Engagement Opportunity'){
			const entities:ComponentFramework.WebApi.RetrieveMultipleResponse = await this.props.WebApi.retrieveMultipleRecords('msnfp_participation',('?$select=_msnfp_contactid_value,_msnfp_engagementopportunityid_value&$filter=_msnfp_engagementopportunityid_value eq '+ this.props.entityId));
			this.createBccMessage(saveData.message,saveData.subject,this.props.userId,entities.entities as ComponentFramework.WebApi.Entity[],'',this.props.entityId);
		}
		this.setState({ isProcessing:false, isPanelOpen:false });
	};

	createBccMessage = (description:string, title:string, userId:string, contacts:ComponentFramework.WebApi.Entity[], groupId:string, engOppId:string) => {
		if(contacts == null || contacts.length < 1) return;
		const activityParties: ComponentFramework.WebApi.Entity[] = [];
		contacts.forEach(e => {
			const Receipent:ComponentFramework.WebApi.Entity = {};
			Receipent['participationtypemask'] = 4;
			Receipent['partyid_contact@odata.bind'] = '/contacts(' + e._msnfp_contactid_value + ')';
			activityParties.push(Receipent);
		});

		const Sender:ComponentFramework.WebApi.Entity = {};
		Sender['participationtypemask'] = 1;
		Sender['partyid_systemuser@odata.bind'] = '/systemusers(' + userId.slice(1,userId.length-1) + ')';
		activityParties.push(Sender);

		const message:ComponentFramework.WebApi.Entity = {};
		message['description'] = description;
		message['subject'] = title;
		message['msnfp_autocomplete'] = true;
		if(groupId != '') message['regardingobjectid_msnfp_group@odata.bind'] = '/msnfp_groups('+ groupId +')';
		if(engOppId != '') message['regardingobjectid_msnfp_engagementopportunity@odata.bind'] = '/msnfp_engagementopportunities('+ engOppId +')';
		message['msnfp_Message_activity_parties'] = activityParties;

		this.props.WebApi.createRecord('msnfp_message', message).then(
			function success(lookup: ComponentFramework.LookupValue) {
				console.log('Message has been created');
			},
			function Error(e: Error) {
				throw e;
			}
		);
	};
}
const stackTokens: IStackTokens = { childrenGap: 20 };
const addIcon: IIconProps = { iconName: 'Message' };
