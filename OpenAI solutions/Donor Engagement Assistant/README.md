# Donor Engagement Assistant

Donor Engagement Assistant is a customized experience for the Microsoft Dynamics 365 Fundraising and Engagement platform to allow users of the system to create targeted email communications to donors. Based on their needs, users will interact with the Microsoft Azure OpenAI Service to create a personal letter and send it to a donor.



## Prerequisites

- Dynamics 365 Sales Enterprise
- Microsoft Cloud for Nonprofit – Fundraising and Engagement https://learn.microsoft.com/en-us/dynamics365/industry/nonprofit/fundraising-engagement-deploy-installer
- Admin access to Microsoft Power Platform, Microsoft Dynamics 365 or tenant admin



## Environment Variables

- AI Letter Generator URL – the URL of the Canvas App in the deployed environment
- Azure OpenAI Host URL – the endpoint of your Azure OpenAI instance
- Azure OpenAI Host URL – the partial URL of a deployed model, e.g. “openai/deployments/gpt-turbo/”



## Manual Solution Installation

1. Navigate to the Power Apps Portal
2. Click on Solutions in the left-hand navigation
3. Click on Import Solution in the top navigation bar
4. Click on browse and locate the unmanaged solution zip file on your computer
5. Follow the remaining prompts to import the solution
	


## Developer Notes

- Find instructions on how to deploy Azure OpenAI [here](https://learn.microsoft.com/en-us/azure/cognitive-services/openai/how-to/create-resource?pivots=web-portal).


## FAQ
### Should the assistant use GPT -3.5 or GPT-4?
The app was tested with GPT-3.5 

### Can the assistant use Azure Open AI?
The app functions with both OpenAI or Azure Open AI. The repo currently uses Azure OpenAI. 
[Request access to Azure OpenAI.](https://customervoice.microsoft.com/Pages/ResponsePage.aspx?id=v4j5cvGGr0GRqy180BHbR7en2Ais5pxKtso_Pz4b1_xUOFA5Qk1UWDRBMjg0WFhPMkIzTzhKQ1dWNyQlQCN0PWcu)

