# Keyword Sentiment Analysis

Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.

This system was a build-with project from the Technology for Social Impact (TSI) Team at Microsoft Philanthropies co-developed with our partner Jump Start Ninja (http://jumpstartninja.com). 

This system has two major components: 
* A Bing API New search system with a PowerBI Dashboard: https://github.com/Microsoft/Nonprofits/tree/master/ProductsAndServices/ActivisimAndAwareness/SocialListening/KeywordSentimentAnalysis/Microsoft-NewsTemplate
* A Twitter monitoring system and accompanying dashboard: https://github.com/Microsoft/Nonprofits/tree/master/ProductsAndServices/ActivisimAndAwareness/SocialListening/KeywordSentimentAnalysis/Microsoft-TwitterTemplate

These systems have three features you can customize:
* The search terms/keywords to identify in the newsfeed or on twitter
* The ability to control the costs by enabling you to set limits for the search criteria (e.g., how often you perform an update)
* The ability to choose which languages to monitor

Features in progress include:
* The "Deploy to Azure" button will take away the steps required to configure the solution
* Demo Script introductory video

Deploy to Azure Setup:
•	is that the Application to do the deployment is asking for my credentials.  Consider that we are asking for some admin to trust our application isn’t using their creds for something else.  I found an article that seems to help?  http://darylscorner.com/2016/01/deploy-to-azure-button/
•	The directory structure of your repo is completely different than the source we started with.  How much have we deviated from the source?  I feel the Microsoft business group spent a lot of resources on the documentation and deployment that we would be better served to continue to follow their structure.
•	The approach I would have taken, modify the init.json to match a Deploy to Azure approach.  The init.json was the code used for the AppSource button, but since we aren’t using AppSource, we are using Deploy To Azure.  The functionality in the init.json would be moved to the AzureDeploy.json.  Best Practices.


<a href="https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FDarylsCorner%2FARM-Templates%2Fmaster%2Fvm-from-user-image%2Fazuredeploy.json" target="_blank">
    <img src="http://azuredeploy.net/deploybutton.png"/>
</a>
