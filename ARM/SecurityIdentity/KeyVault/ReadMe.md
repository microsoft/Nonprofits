# Azure Foundation KeyVault

This folder contains the parameters for the KeyVault, one per Region.  For example if you have two enrollments, 
one for Commercial and one for Government, you'd need two KeyVaults.

## Setup - Connecting to the Government Cloud

The PowerShell in this folder will set the subscription to the "services" subscription.


## Deploying the VNET.

The Parameters file will need to be modified to match the environment.  The secrets used by the workloads are stored in the file, however the value of the secrets is not.  The parameter file should be stored on local storage
so the values are not exposed to the internet or the internal code repository.

After the deployment is run, the parameters for the secrets should be removed.  

# Parameters in Deployment
One concern with the current deployment method is that when the files are pushed to blob storage using the -UploadArtifacts parameter (the default in the workload PowerShell scripts) the parameters file and primary template are also pushed to blob storage. These file will likely contain passwords that should not be shared. The script needs to be modified not to deploy these files, for example to retrieve the credentials from an Azure Key Vault, and pass to the ARM deployment as a secure object.

arameters in Deployment



