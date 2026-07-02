#!/bin/bash

package_file_path="/app/ManifestPackage.nupkg"

# Check if LOG_LEVEL is set, if not set it to Information
if [ -z "${LOG_LEVEL}" ]; then
    export LOG_LEVEL="Information"
    echo "LOG_LEVEL is not set. Defaulting to 'Information'."
fi

# List of required environment variables and mounted files
required_env_vars=("ENTRA_TENANT_ID" "LOCAL_BACKEND_PORT" "DEV_WORKSPACE_ID")
required_files=($package_file_path)
unset_vars=()
missing_files=()

# Check if all required environment variables are set
for var in "${required_env_vars[@]}"; do
    if [ -z "${!var}" ]; then
        unset_vars+=("$var")
    fi
done

# Check if all required files exist
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

# Print unset variables and missing files, then exit if any are found
if [ ${#unset_vars[@]} -ne 0 ] || [ ${#missing_files[@]} -ne 0 ]; then
    if [ ${#unset_vars[@]} -ne 0 ]; then
        echo "Error: The following environment variables are not set:"
        for var in "${unset_vars[@]}"; do
            echo "$var"
        done
        echo "Please set the environment variables in the .env file."
    fi

    if [ ${#missing_files[@]} -ne 0 ]; then
        echo "Error: The following required files do not exist:"
        for file in "${missing_files[@]}"; do
            echo "$file"
        done
        echo "Please mount the files to the specified paths using the --mount flag."
    fi

    exit 1
fi

# Check if already logged in
if ! az account show > /dev/null 2>&1; then
    echo "Not logged in. Performing az login..."
    # disable the subscription selector (v. 2.61.0 and up) - https://learn.microsoft.com/en-us/cli/azure/authenticate-azure-cli-interactively
    az config set core.login_experience_v2=off
    az login -t $ENTRA_TENANT_ID --allow-no-subscriptions --use-device-code
else
    echo "Already logged in."
fi

# Write access token to local variable
token=$(az account get-access-token --scope https://analysis.windows.net/powerbi/api/.default --query accessToken -o tsv)

dotnet "DevGateway/Microsoft.Fabric.Workload.DevGateway.dll" \
    -LogLevel $LOG_LEVEL \
    -DevMode:UserAuthorizationToken $token \
    -DevMode:ManifestPackageFilePath $package_file_path \
    -DevMode:WorkspaceGuid $DEV_WORKSPACE_ID \
    -DevMode:WorkloadEndpointUrl http://host.docker.internal:${LOCAL_BACKEND_PORT}/workload