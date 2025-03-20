import * as React from 'react';
import { IStackTokens, DefaultButton, PrimaryButton, Panel, PanelType, TextField, IStackStyles, Stack, Label, Spinner, SpinnerSize } from '@fluentui/react';
import { LocalizedStrings as strings } from '../strings';

export class SendMessagePanelProps{
	isPanelOpen: boolean;
	isProcessing: boolean;
	showErrorOnLoad: boolean;
	updateView: (_ShowPanel: boolean) => void;
	onSave: (_saveData: SendMessagePanelState) => void;
	userFullName:string;
	entityType:string;
}
export class SendMessagePanelState{
	subject: string;
	message: string;
}
export class SendMessagePanel extends React.Component <SendMessagePanelProps, SendMessagePanelState> {
	isOpen: boolean = this.props.isPanelOpen;
	dismissPanel = () :void => {if(!this.props.isProcessing)this.props.updateView(false);};
	constructor (props:SendMessagePanelProps){
		super(props);
		this.isOpen = this.props.isPanelOpen;
		this.state ={
			subject:'',
			message:''
		};
	}

	render():JSX.Element {
		return(
			<Panel
				type={PanelType.medium}
				isOpen={this.props.isPanelOpen}
				onDismiss={this.dismissPanel}
				headerText={this.props.entityType == 'Group' ? strings.titleSendMessagePanelGroupTitle : strings.titleSendMessagePanelNonGroupTitle}
				closeButtonAriaLabel={strings.closeButtonAriaLabel}
				onRenderFooterContent={this.onRenderFooterContent}
				isFooterAtBottom={true}
			>
				{this.props.isProcessing ? this.rednerIsProcessing() : null}
				{this.props.isProcessing ? null :this.renderLoadError() }
				{this.props.isProcessing ? null :this.renderMessageContent()}
			</Panel>
		);
	}

	private rednerIsProcessing():JSX.Element {
		return(
			<Stack horizontal disableShrink horizontalAlign="center" verticalAlign="center" styles={{root: {height: 400}}}>
				<Stack.Item align="center">
					<Spinner size={SpinnerSize.large} label={`${strings.processing}...`} />
				</Stack.Item>
			</Stack>
		);
	}

	renderLoadError = (): React.ReactNode => {
		if(this.props.showErrorOnLoad){
			return(
				<Label hidden={!this.props.showErrorOnLoad} style={{color: 'red', fontWeight:'bold'}}>{strings.completeRequiredFieldsMessage}</Label>
			);
		}
	};

	private renderMessageContent = ():JSX.Element => {
		return(
			<Stack tokens={wrapStackTokens} styles={stackStyles}>
				<Stack.Item grow>
					<TextField label={strings.fromFieldLabel} disabled defaultValue={this.props.userFullName} />
				</Stack.Item>
				<Stack.Item grow>
					<TextField label={strings.toFieldLabel} disabled defaultValue={this.props.entityType == 'Group'? strings.toFieldAllGroupMembersOption : strings.toFieldAllParticipantsOption} />
				</Stack.Item>
				<Stack.Item grow>
					<TextField label={strings.subjectFieldLabel} required onChange={(e: React.FormEvent, n?: string | undefined) => { this.setState({ subject: n || '' }); }} />
				</Stack.Item>
				<Stack.Item  grow>
					<TextField label={strings.messageFieldLabel} rows={8}  multiline autoAdjustHeight required onChange={(e: React.FormEvent, n?: string | undefined) => { this.setState({ message: n || '' }); }} />
				</Stack.Item>
			</Stack>
		);
	};

	onRenderFooterContent = ():JSX.Element => {
		return (
			<div>
				<PrimaryButton onClick={()=>{this.props.onSave(this.state);}} styles={buttonStyles} disabled={this.props.isProcessing}>{strings.saveButtonText}</PrimaryButton>
				<DefaultButton onClick={this.dismissPanel} disabled={this.props.isProcessing}>{strings.cancelButtonText}</DefaultButton>
			</div>
		);
	};
}
const wrapStackTokens: IStackTokens = { childrenGap: 20 };
const stackStyles: Partial<IStackStyles> = { root: { width: '100%' } };
const buttonStyles = { root: { marginRight: 8 } };
