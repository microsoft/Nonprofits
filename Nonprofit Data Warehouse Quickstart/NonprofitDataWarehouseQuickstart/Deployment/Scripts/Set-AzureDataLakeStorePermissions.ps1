    <#
    
	# Copyright (c) Microsoft Corporation.
	# Licensed under the MIT License.
	
	.SYNOPSIS
        Creates ADLS folder structure and permissions

    .DESCRIPTION
        Creates ADLS folder structure and permissions based on specified json definition. Uses REST API calls. Works for MSI, Service Principals, Groups, Users

    .PARAMETER ResourceGroupName
        ResourceGroupName e.g. "mstsidhrgweudev"

    .PARAMETER StorageAccountName
        Azure Data Lake Store Account Name e.g. mstsidhadlsweudev
    
    .PARAMETER FilesystemName
        Name of the filesystem in Azure Data Lake Storage e.g. datahub
  
    .PARAMETER PermissionsConfigurationJson
        Json Array that defines folder structure and permissions. Each level need to be defined separately Root, Folder in the Root (Level1), Subfolder (Level2)
        e.g.
        [{"Folder":"RAW","Permissions":[{"Type":"sp","Principal":"mstsidhadfweudev","Access":"rwx"},{"Type":"default:sp","Principal":"mstsidhadfweudev","Access":"rwx"},{"Type":"g","Principal":"AAD-GRP-MSTSIDH-DEV-DEVELOPER","Access":"rwx"},{"Type":"default:g","Principal":"AAD-GRP-MSTSIDH-DEV-DEVELOPER","Access":"rwx"},{"Type":"g","Principal":"AAD-GRP-MSTSIDH-DEV-ADMIN","Access":"rwx"},{"Type":"default:g","Principal":"AAD-GRP-MSTSIDH-DEV-ADMIN","Access":"rwx"}]},{"Folder":"/","Permissions":[{"Type":"sp","Principal":"mstsidhadfweudev","Access":"rwx"},{"Type":"g","Principal":"AAD-GRP-MSTSIDH-DEV-DEVELOPER","Access":"rwx"},{"Type":"g","Principal":"AAD-GRP-MSTSIDH-DEV-ADMIN","Access":"rwx"}]}]

    .OUTPUTS
       No objects are outputed

    .EXAMPLE
        ./Set-AzureDataLakeStorePermissions -ResourceGroupName "mstsidhrgweudev" -StorageAccountName "mstsidhadlsweudev" -FilesystemName "datahub" -PermissionsConfigurationJson '[{"Folder":"RAW","Permissions":[{"Type":"sp","Principal":"mstsidhadfweudev","Access":"rwx"},{"Type":"default:sp","Principal":"mstsidhadfweudev","Access":"rwx"},{"Type":"g","Principal":"AAD-GRP-MSTSIDH-DEV-DEVELOPER","Access":"rwx"},{"Type":"default:g","Principal":"AAD-GRP-MSTSIDH-DEV-DEVELOPER","Access":"rwx"},{"Type":"g","Principal":"AAD-GRP-MSTSIDH-DEV-ADMIN","Access":"rwx"},{"Type":"default:g","Principal":"AAD-GRP-MSTSIDH-DEV-ADMIN","Access":"rwx"}]},{"Folder":"/","Permissions":[{"Type":"sp","Principal":"mstsidhadfweudev","Access":"rwx"},{"Type":"g","Principal":"AAD-GRP-MSTSIDH-DEV-DEVELOPER","Access":"rwx"},{"Type":"g","Principal":"AAD-GRP-MSTSIDH-DEV-ADMIN","Access":"rwx"}]}]'

    .NOTES
        -Script requires AzureRM Modules installed on the machine where script is executed (requires administrator rights)
        -Script requires Owner of the subscription/resource group to log in e.g. Login-AzureRmAccount -SubscriptionId '{subscriptionId}' - this need to be executed only once.
        -Check parameter details for instructions     
    #>

Param(
    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $ResourceGroupName = "mstsidhrgweudev",

    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $StorageAccountName = "mstsidhadlsweudev",

    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $FilesystemName = "datahub",

	[Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
	[string] $PermissionsConfigurationJson = '[{"Folder":"RAW","Permissions":[{"Type":"sp","Principal":"mstsidhadfweudev","Access":"rwx"},{"Type":"default:sp","Principal":"mstsidhadfweudev","Access":"rwx"},{"Type":"g","Principal":"AAD-GRP-MSTSIDH-DEV-DEVELOPER","Access":"rwx"},{"Type":"default:g","Principal":"AAD-GRP-MSTSIDH-DEV-DEVELOPER","Access":"rwx"},{"Type":"g","Principal":"AAD-GRP-MSTSIDH-DEV-ADMIN","Access":"rwx"},{"Type":"default:g","Principal":"AAD-GRP-MSTSIDH-DEV-ADMIN","Access":"rwx"}]},{"Folder":"/","Permissions":[{"Type":"sp","Principal":"mstsidhadfweudev","Access":"rwx"},{"Type":"g","Principal":"AAD-GRP-MSTSIDH-DEV-DEVELOPER","Access":"rwx"},{"Type":"g","Principal":"AAD-GRP-MSTSIDH-DEV-ADMIN","Access":"rwx"}]}]'
)

### Clear Screen
# Uncomment below line to clear screen
#cls;

### Login
# Uncomment below line to login
# Login-AzureRmAccount -SubscriptionId '{subscriptionId}'

Write-Host "### Script Started-Assign ADLS Permissions and folder structure";

### Defines function to deserialize json array
Function ConvertFrom-JsonArray
{
	Param(
		[Parameter(Mandatory = $true)]
		[ValidateNotNullOrEmpty()]
		[string] $Json
    )

    $jsonWraper= "{""Array"":" + $Json + "}";
    $array = ConvertFrom-Json -InputObject $jsonWraper; 
    return [array]$array.Array;
}

### Defines function that creates Storage Access Key
function Get-StorageAccessKey
{
    Param(
        [string] $ResourceGroupName,
        [string] $StorageAccountName        
    )

    $key = (Get-AzStorageAccountKey -ResourceGroupName $ResourceGroupName -Name $StorageAccountName)[0].Value
    return $key
}

### Defines function to create File system
function Create-FileSystem
{
    Param(
      [Parameter(Mandatory=$true,Position=1)] [string] $StorageAccountName,
      [Parameter(Mandatory=$True,Position=2)] [string] $FilesystemName,
      [Parameter(Mandatory=$True,Position=3)] [string] $AccessKey
    )

    Write-Host "Creating file system $FileSystemName in $StorageAccountName storage account."

    # Rest documentation:
    # https://docs.microsoft.com/en-us/rest/api/storageservices/datalakestoragegen2/filesystem/create
    $date = [System.DateTime]::UtcNow.ToString("R") # ex: Sun, 10 Mar 2019 11:50:10 GMT
    $n = "`n"
    $method = "PUT"
    $stringToSign = "$method$n" #VERB
    $stringToSign += "$n" # Content-Encoding + "\n" +  
    $stringToSign += "$n" # Content-Language + "\n" +  
    $stringToSign += "$n" # Content-Length + "\n" +  
    $stringToSign += "$n" # Content-MD5 + "\n" +  
    $stringToSign += "$n" # Content-Type + "\n" +  
    $stringToSign += "$n" # Date + "\n" +  
    $stringToSign += "$n" # If-Modified-Since + "\n" +  
    $stringToSign += "$n" # If-Match + "\n" +  
    $stringToSign += "$n" # If-None-Match + "\n" +  
    $stringToSign += "$n" # If-Unmodified-Since + "\n" +  
    $stringToSign += "$n" # Range + "\n" + 
    $stringToSign +=    
                        <# SECTION: CanonicalizedHeaders + "\n" #>
                        "x-ms-date:$date" + $n + 
                        "x-ms-version:2018-11-09" + $n # 
                        <# SECTION: CanonicalizedHeaders + "\n" #>
    $stringToSign +=    
                        <# SECTION: CanonicalizedResource + "\n" #>
                        "/$StorageAccountName/$FilesystemName" + $n + 
                        "resource:filesystem"# 
                        <# SECTION: CanonicalizedResource + "\n" #>
    $sharedKey = [System.Convert]::FromBase64String($AccessKey)
    $hasher = New-Object System.Security.Cryptography.HMACSHA256
    $hasher.Key = $sharedKey
    $signedSignature = [System.Convert]::ToBase64String($hasher.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($stringToSign)))
 
    $authHeader = "SharedKey ${StorageAccountName}:$signedSignature"
    $headers = @{"x-ms-date"=$date} 
    $headers.Add("x-ms-version","2018-11-09")
    $headers.Add("Authorization",$authHeader)
    $URI = "https://$StorageAccountName.dfs.core.windows.net/" + $FilesystemName + "?resource=filesystem"
    Try {
        Invoke-RestMethod -method $method -Uri $URI -Headers $headers # returns empty response
    }
    catch {
		$ErrorMessage = $_.Exception.Message
		$StatusDescription = $_.Exception.Response.StatusDescription
		if ($StatusDescription -Match "already exists") {
		}
		else {
			$false
			Throw $ErrorMessage + " " + $StatusDescription
		}	
    }
}

### Defines function to create directory
function Create-Directory
{
	Param(
	  [Parameter(Mandatory=$true,Position=1)] [string] $StorageAccountName,
	  [Parameter(Mandatory=$True,Position=2)] [string] $FilesystemName,
	  [Parameter(Mandatory=$True,Position=3)] [string] $AccessKey,
	  [Parameter(Mandatory=$True,Position=4)] [string] $PathToCreate
	)

    Write-Host "Creating $PathToCreate path in $FilesystemName file system in the $StorageAccountName storage account."

	# Rest documentation:
	# https://docs.microsoft.com/en-us/rest/api/storageservices/datalakestoragegen2/path/create
	$PathToCreate = "/" + $PathToCreate.trim("/") # remove all "//path" or "path/"
	$date = [System.DateTime]::UtcNow.ToString("R") # ex: Sun, 10 Mar 2019 11:50:10 GMT
	$n = "`n"
	$method = "PUT" 
	$stringToSign = "$method$n" #VERB
	$stringToSign += "$n" # Content-Encoding + "\n" +  
	$stringToSign += "$n" # Content-Language + "\n" +  
	$stringToSign += "$n" # Content-Length + "\n" +  
	$stringToSign += "$n" # Content-MD5 + "\n" +  
	$stringToSign += "$n" # Content-Type + "\n" +  
	$stringToSign += "$n" # Date + "\n" +  
	$stringToSign += "$n" # If-Modified-Since + "\n" +  
	$stringToSign += "$n" # If-Match + "\n" +  
	$stringToSign += "*" + "$n" # If-None-Match + "\n" +  
	$stringToSign += "$n" # If-Unmodified-Since + "\n" +  
	$stringToSign += "$n" # Range + "\n" + 
	$stringToSign +=    
						<# SECTION: CanonicalizedHeaders + "\n" #>
						"x-ms-date:$date" + $n + 
						"x-ms-version:2018-11-09" + $n # 
						<# SECTION: CanonicalizedHeaders + "\n" #>	 
	$stringToSign +=    
						<# SECTION: CanonicalizedResource + "\n" #>
						"/$StorageAccountName/$FilesystemName" + $PathToCreate + $n + 
						"resource:directory"# 
						<# SECTION: CanonicalizedResource + "\n" #> 
	$sharedKey = [System.Convert]::FromBase64String($AccessKey)
	$hasher = New-Object System.Security.Cryptography.HMACSHA256
	$hasher.Key = $sharedKey 
	$signedSignature = [System.Convert]::ToBase64String($hasher.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($stringToSign)))
	 	 
	$authHeader = "SharedKey ${StorageAccountName}:$signedSignature"	 
	$headers = @{"x-ms-date"=$date} 
	$headers.Add("x-ms-version","2018-11-09")
	$headers.Add("Authorization",$authHeader)
	$headers.Add("If-None-Match","*") # To fail if the destination already exists, use a conditional request with If-None-Match: "*"	 
	$URI = "https://$StorageAccountName.dfs.core.windows.net/" + $FilesystemName + $PathToCreate + "?resource=directory"	 
	try {
		Invoke-RestMethod -method $method -Uri $URI -Headers $headers # returns empty response
	}
	catch {
		$ErrorMessage = $_.Exception.Message
		$StatusDescription = $_.Exception.Response.StatusDescription
		if ($StatusDescription -Match "already exists") {
		}
		else {
			$false
			Throw $ErrorMessage + " " + $StatusDescription
		}	
	} 
 }
 
 ### Defines function to Set Permissions
 function Set-Permissions
{
	Param(
	  [Parameter(Mandatory=$true,Position=1)] [string] $StorageAccountName,
	  [Parameter(Mandatory=$True,Position=2)] [string] $AccessKey,
	  [Parameter(Mandatory=$True,Position=3)] [string] $FilesystemName,
	  [Parameter(Mandatory=$True,Position=4)] [string] $Path,
	  [Parameter(Mandatory=$True,Position=5)] [string] $PermissionString
	)

    Write-Host "Setting permissions to $PermissionString for $Path path in $FilesystemName file system in the $StorageAccountName storage account."

	# Rest documentation:
	# https://docs.microsoft.com/en-us/rest/api/storageservices/datalakestoragegen2/path/update
	$date = [System.DateTime]::UtcNow.ToString("R") # ex: Sun, 10 Mar 2019 11:50:10 GMT
	$n = "`n"
	$method = "PATCH"
	$stringToSign = "$method$n" #VERB
	$stringToSign += "$n" # Content-Encoding + "\n" +  
	$stringToSign += "$n" # Content-Language + "\n" +  
	$stringToSign += "$n" # Content-Length + "\n" +  
	$stringToSign += "$n" # Content-MD5 + "\n" +  
	$stringToSign += "$n" # Content-Type + "\n" +  
	$stringToSign += "$n" # Date + "\n" +  
	$stringToSign += "$n" # If-Modified-Since + "\n" +  
	$stringToSign += "$n" # If-Match + "\n" +  
	$stringToSign += "$n" # If-None-Match + "\n" +  
	$stringToSign += "$n" # If-Unmodified-Since + "\n" +  
	$stringToSign += "$n" # Range + "\n" + 
	$stringToSign +=    
						<# SECTION: CanonicalizedHeaders + "\n" #>
						"x-ms-acl:$PermissionString" + $n +
						"x-ms-date:$date" + $n + 
						"x-ms-version:2018-11-09" + $n # 
						<# SECTION: CanonicalizedHeaders + "\n" #>
	$stringToSign +=    
						<# SECTION: CanonicalizedResource + "\n" #>
						"/$StorageAccountName/$FilesystemName/$Path" + $n + 
						"action:setAccessControl"
						<# SECTION: CanonicalizedResource + "\n" #> 
	$sharedKey = [System.Convert]::FromBase64String($AccessKey)
	$hasher = New-Object System.Security.Cryptography.HMACSHA256
	$hasher.Key = $sharedKey
	$signedSignature = [System.Convert]::ToBase64String($hasher.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($stringToSign)))
	 
	$authHeader = "SharedKey ${StorageAccountName}:$signedSignature"
	$headers = @{"x-ms-date"=$date} 
	$headers.Add("x-ms-version","2018-11-09")
	$headers.Add("Authorization",$authHeader)
	$headers.Add("x-ms-acl",$PermissionString) 
	$URI = "https://$StorageAccountName.dfs.core.windows.net/" + $FilesystemName + "/" + $Path + "?action=setAccessControl"
	Try {
	  Invoke-RestMethod -method $method -Uri $URI -Headers $headers | Out-Null
	}
	catch {
	  $ErrorMessage = $_.Exception.Message
	  $StatusDescription = $_.Exception.Response.StatusDescription
	  $false
	  Throw $ErrorMessage + " " + $StatusDescription
	}
}


### Execution of the Script

try
{

    # Get Azure Storage key
    $AccessKey = (Get-AzStorageAccountKey -ResourceGroupName $ResourceGroupName -Name $StorageAccountName).Value[0];

    # Create FileSystems
    Create-FileSystem `
        -StorageAccountName $StorageAccountName `
        -FilesystemName $FilesystemName `
        -AccessKey $AccessKey;

    $PermissionsConfiguration = ConvertFrom-JsonArray $PermissionsConfigurationJson;

    foreach ($configuration in $PermissionsConfiguration)
    {
        #Generate directory permissions string
        $GeneratedPermissionString = "";

        # Defines dirctionary for the permissions
        $dictionary = @{
            "default:g"="default:group";
            "g"="group";
            "default:u"="default:user";
            "u"="user";
            "default:sp"="default:user";
            "sp"="user";
            "default:o"="default:other";
            "o"="other";
        }

        # iterates over permissions and assing them to a folder
        foreach($permission in $configuration.Permissions)
        {
            $principalId = "";

            #Obtain Principal Id depending on the type
            if(($permission.Type -eq "g") -or ($permission.Type -eq "default:g"))
            {
                ## Obtain Group ID (for support for users and SP need to be refactored)
                $principalId = (Get-AzADGroup -DisplayNameStartsWith $permission.Principal).Id;
            }
		    elseIf(($permission.Type -eq "u") -or ($permission.Type -eq "default:u"))
            {
                ## Obtain Group ID (for support for users and SP need to be refactored)
                $principalId = (Get-AzADUser -DisplayName $permission.Principal).Id;
            }
            elseIf(($permission.Type -eq "sp" -or ($permission.Type -eq "default:sp")))
            {
                ## Obtain Group ID (for support for users and SP need to be refactored)
                $principalId = (Get-AzADServicePrincipal -DisplayName $permission.Principal).Id;
            }
            else
            {
                throw "Principal type not found. Allowed values: g, default:g, u, default:u, sp, default:sp.";
            }
            $GeneratedPermissionString += "$($dictionary[$permission.Type]):$($principalId):$($Permission.Access),";
        }
        $GeneratedPermissionString = $GeneratedPermissionString.TrimEnd(",");

        #  Create directory
	    if($configuration.Folder -ne "/")
	    {
		    Create-Directory `
                -StorageAccountName $StorageAccountName `
                -FilesystemName $FilesystemName `
                -AccessKey $AccessKey `
                -PathToCreate $configuration.Folder;
	    }

        # Assigne permissions
	    Set-Permissions `
            -StorageAccountName $StorageAccountName `
            -AccessKey $AccessKey `
            -FilesystemName $FilesystemName `
            -Path $configuration.Folder `
            -PermissionString $GeneratedPermissionString;
        Write-Host "#-----------------------------------"
    }
    Write-Host "### Script Succeded" -ForegroundColor Green;
}
catch
{
    Write-Host "### Script Failed" -ForegroundColor Red;
}


