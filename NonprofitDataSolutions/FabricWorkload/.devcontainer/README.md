# Development Container Configuration for Microsoft Fabric Workload

This directory contains the configuration for GitHub Codespaces and Visual Studio Code Remote Containers. It provides a consistent development environment with all the necessary tools pre-installed.

## What's Included

- **.NET SDK 8.0**: For building .NET applications
- **PowerShell**: For running the setup scripts and automation
- **Node.js**: For frontend development
- **Azure CLI**: For interacting with Azure resources
- **Azure Functions Core Tools**: For local development and testing
- **Common utilities**: Git, curl, jq, etc.

## Port Configuration

The following ports are forwarded from the container to your local machine:

- **3000**: For frontend development
- **60006**: This is where the Fabric frontend is hosted

## Getting Started

1. Open this repository in GitHub Codespaces or using VS Code Remote Containers
2. Wait for the container to build and initialize
3. Run the setup script to configure your development environment:

   ```powershell
   .\scripts\Setup\Setup.ps1
   ```

4. Follow the instructions in the main [README.md](../README.md) to start developing

## Customizing the Configuration

If you need to make changes to the development container:

1. Modify the `devcontainer.json` file to add extensions or change settings
2. Update the `Dockerfile` to install additional dependencies
3. Rebuild the container to apply your changes
