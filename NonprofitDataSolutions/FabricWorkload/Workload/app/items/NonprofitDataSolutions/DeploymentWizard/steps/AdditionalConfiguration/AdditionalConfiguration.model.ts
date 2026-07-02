/**
 * AdditionalConfiguration Model
 * Data structures for the data source integrations step
 */

export const additionalConfigurationLabels = {
	introduction: {
		title: 'Data source integrations',
		description: 'Connect your fundraising data to Fabric.',
	},
	dynamics365: {
		title: 'Dynamics 365 Sales with Common Data Model for Nonprofits',
		subtitle: 'The following tables will be integrated',
		setupGuideLabel: 'Open Dynamics 365 Sales setup guide in new browser tab',
		configLabel: 'Dynamics 365 Sales Configuration',
		connectionGuideLabel: 'Open Dynamics 365 connection guide in new browser tab',
		connectionGuideText: 'How to connect',
		lakehouseDropdown: {
			label: 'Lakehouse',
			placeholder: 'Select Dataverse lakehouse',
			description: "Select a lakehouse that's connected to your Dynamics 365 Sales environment",
		},
		beforeSelectingTitle: 'Before selecting:',
		tablesLabel: 'Tables that will be integrated',
		tablesAriaLabel: 'Dynamics 365 tables to be integrated',
	},
	salesforce: {
		title: 'Salesforce Nonprofit Success Pack',
		subtitle: 'Salesforce Nonprofit Success Pack objects that will be integrated',
		setupGuideLabel: 'Open Salesforce Nonprofit Success Pack setup guide in new browser tab',
		configLabel: 'Salesforce Nonprofit Success Pack Configuration',
		connectionGuideLabel: 'Open Fabric connections page in new browser tab',
		connectionGuideText: 'Create connection',
		connectionDropdown: {
			label: 'Connection',
			placeholder: 'Select Salesforce connection',
			description: 'Select a connection to your Salesforce Nonprofit Success Pack environment',
		},
		beforeSelectingTitle: 'Before selecting:',
		objectsLabel: 'Nonprofit Success Pack objects that will be integrated',
		objectsAriaLabel: 'Nonprofit Success Pack objects to be integrated',
	},
};

// Dynamics 365 Sales tables that will be integrated
export const dynamicsTables: string[] = [
	'account',
	'campaign',
	'contact',
	'customeraddress',
	'email',
	'letter',
	'msnfp_designatedcredit',
	'msnfp_designation',
	'msnfp_transaction',
	'opportunity',
	'opportunitysalesprocess',
	'phonecall',
];

// Salesforce NPSP objects that will be integrated
export const salesforceObjects: string[] = [
	'Account',
	'Campaign',
	'CampaignMember',
	'Contact',
	'EmailMessageRelation',
	'Event',
	'GW_Volunteers__Volunteer_Hours__c',
	'npsp__Address__c',
	'Opportunity',
	'OpportunityContactRole',
	'OpportunityStage',
	'RecordType',
	'Task',
];

// Integration setup documentation links
export const documentationLinks = {
	dynamics365: {
		setupGuide: 'https://aka.ms/DataverseExtendsToFabric',
		connectionGuide: 'https://aka.ms/nds/docs/configd365',
	},
	salesforce: {
		setupGuide: 'https://learn.microsoft.com/en-us/fabric/data-factory/connector-salesforce-objects',
	},
} as const;

// Validation messages
export const validationMessages = {
	dynamics365Info:
		"Ensure Link Dataverse to Microsoft Fabric is configured and the lakehouse is synchronized. All required tables must have the Change tracking feature enabled in Dynamics 365. Make sure that you're using Common Data Model for Nonprofits version 3.1.3.4 or later.",
	salesforceInfo:
		'Verify that your Salesforce objects connection has API access enabled and the necessary permissions to read Salesforce Nonprofit Success Pack objects.',
} as const;
