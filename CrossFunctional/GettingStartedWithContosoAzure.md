1.	Get your Demo environment.  https://demos.microsoft.com, these guys give you an M365name.onmicrosoft.com tenant
2.	Make a couple of Users in the new tenant that will live past the individual, like an account for the Azure Internal Request, but also a personal account to tie the D365 request to.  For example, contoso_aa@contoso.org and willst@contoso.org. 
3.	If you want D365 as part of it, better go to https://trials.dynamics.com/, make sure you’re in an InPrivate session with your personal contoso.org account.  
4.	You have to get your internal subscription and change the directory for that subscription.  Until recently that was possible via the old portal and is disabled now.  The only option is to use the AIRS tool and get an account associated to an “Existing Tenant”.  https://aka.ms/airs
5.	Next, build out your hybrid networking by starting with a domain name, https://prod.msftdomains.com/  This tool will let you get the name.  
a.	With contoso.org, for example, we couldn’t ask for the root domain, so we got a prefix of tsi.contoso.org, and requested the TXT record required for the domain registration to contoso.org for the domain validation.  The domain team request will next include a NS change for the tsi.contoso.com to the DNS Zone you create in your azure tenant.
b.	Create your four datacenter design, we have a pattern we used in PubSec called the AzureFoundation, we are hosting that now in https://github.com/microsoft/nonprofits/crossfunctional/ARM/Networking with a customization process.  We’re currently in the process of making this Azure virtual WAN option
6.	Set up a hybrid identity
a.	Create your domain and put a domain controller in each site.  Make an OU for your team, a DNS Prefix that matches the Domain requested above, start making users from your team with that DNS prefix.
b.	Create your AAD Connect server and synchronize the users to the tenant that is running your O365, D365, and Azure.
7.	These prerequisites takes about eight hours of work to set up from scratch…And 8 hours is hard to find to set up the lab.  But now, you know what our customers know.  You can try what our customers try.  You can see the world as the Global Administrator, the Account Administrator, the User Administrator’s perspective.  Your demos and screen shots in your documentation will be authentic and geared towards the industry you’re focused on.

The documentation of a static environment is invaluable, since the Visio can be updated once, and all of the people participating in the lab can leverage it, they all get the productivity gain of not having to start over.

