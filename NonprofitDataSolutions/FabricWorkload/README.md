# Microsoft Fabric Software Developer Kit

Welcome to the Fabric Workload Development Kit. This comprehensive guide covers everything you need to know to create a custom Fabric workload for your organization. We’re here to assist you every step of the way, so please don’t hesitate to reach out with any questions. Happy developing!

[!NOTE]
This particular repoistory represents the work of the next version of the Workload Development Kit (v2).

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft
trademarks or logos is subject to and must follow [Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.

## Table of contents

- [Microsoft Fabric Software Developer Kit](#microsoft-fabric-software-developer-kit)
  - [Trademarks](#trademarks)
  - [Table of contents](#table-of-contents)
- [Introduction](#introduction)
  - [What is Fabric](#what-is-fabric)
  - [What Are Workloads](#what-are-workloads)
  - [What is the Workload Development Kit](#what-is-the-workload-development-kit)
- [Build Your Own Workload](#build-your-own-workload)
  - [Get Started](#get-started)
    - [Prerequisits](#prerequisits)
    - [Setting things up](#setting-things-up)
  - [Implement your custom workload](#start-coding)
  - [Publish your workload](#publish-your-workload)
    - [Certification and publishing resources](#certification-and-publishing-resources)
- [Resources](#resources)

## Introduction

### What is Fabric

Microsoft Fabric is a comprehensive analytics solution designed for enterprise-level applications. This platform encompasses a wide range of services, including data engineering, real-time analytics, and business intelligence, all consolidated within a single, unified framework.

The key advantage of Microsoft Fabric is its integrated approach, that eliminates the need for distinct services from multiple vendors. Users can leverage this platform to streamline their analytics processes, with all services accessible from a single source of truth.

Microsoft Fabric provides integration and simplicity, as well as a transparent and flexible cost management experience. This cost management experience allows users to control expenses effectively by ensuring they only pay for the resources they require.

The Fabric platform is not just a tool, but a strategic asset that simplifies and enhances the analytics capabilities of any enterprise.
More information about Fabric can be found in the [documentation](https://learn.microsoft.com/en-us/fabric/get-started/microsoft-fabric-overview).

### What Are Workloads

In Microsoft Fabric, workloads signify different components that are integrated into the Fabric framework. Workloads enhance the usability of your service within the familiar Fabric workspace, eliminating the need to leave the Fabric environment for different services. [Data Factory](https://learn.microsoft.com/en-us/fabric/data-factory/data-factory-overview), [Data Warehouse](https://learn.microsoft.com/en-us/fabric/data-warehouse/data-warehousing), [Power BI](https://learn.microsoft.com/en-us/power-bi/enterprise/service-premium-what-is) and [Fabric Activator](https://learn.microsoft.com/en-us/fabric/real-time-intelligence/data-activator/activator-introduction) are some of the built-in Fabric workloads.

### What is the Workload Development Kit

With the Workload Development Kit, you can create your own workload for your data applications. Publishing a Fabric Workload to the [Fabric Workload Hub](https://learn.microsoft.com/en-us/fabric/workload-development-kit/more-workloads-add) increases your application’s discoverability and user engagement. The Microsoft Fabric Workload Development Kit provides the necessary tools and interfaces to embed your data application into Microsoft Fabric.

For more information on what workloads can offer Microsoft partners, and for useful examples, head to our official [Workload Dev Kit documentation](https://learn.microsoft.com/en-us/fabric/workload-development-kit/development-kit-overview).

You can also learn more about the new [Fabric workload architecture](./docs/WDKv2-Introduction.md).

## Build Your Own Workload

### Get Started

#### Prerequisits

To run the development enviroment locally you need the follwoing components:

- [Node.js](https://nodejs.org/en/download/)
- [Powershell 7](https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell)
- [Dotnet](https://dotnet.microsoft.com/en-us/download) for MacOS please make sure to install the x64 version
- [VSCode](https://code.visualstudio.com/download) or simmilar development enviroment
- [Fabric Tenant](https://app.fabric.microsoft.com/) that you use for development and publishing the Workload later on
- [Fabric Workspace](https://learn.microsoft.com/en-us/fabric/fundamentals/workspaces) that you can use to build your workload
- [Fabric Capacity](https://learn.microsoft.com/en-us/fabric/enterprise/licenses) that is assigned to the workspace you are planning to use
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest) (only used for Entra App creation)
- [Entra App](https://entra.microsoft.com/) You either need an existing Entra App configured with the workload redirect URIs or permission to create a new Entra App.

If you don't want to install all dependencies you can also create a devcontainer with the configuration provided in this repository, or create a [Codespace](https://github.com/features/codespaces) in GitHub directly. If you use a codespace please make sure that you select at least an 8 core machine and open the Codespace in VSCode locally.

#### Setting things up

Run the setup scripts in `scripts/Setup/` and configure `Workload/.env.dev` for your Fabric tenant and workspace.

### Start coding

After you have completed the initial steps you are all set to start adopting the Workload sample to your needs.

Be sure to look at what has been released with the [newest version of the WDK](./docs/WDKv2-Introduction.md).

### Publish your workload

Once you customize this workload, you can publish it either **internally** (to your own Fabric tenant) or **cross-tenant** (to all Fabric customers through the Workload Hub). Cross-tenant distribution goes through a Microsoft **certification** process; internal publishing does not.

Start with the [Publishing overview](https://learn.microsoft.com/en-us/fabric/extensibility-toolkit/publishing-overview) to pick the scenario that fits, then work through the requirements below before submitting the [Publishing Request Form](https://aka.ms/fabric_workload_publishing).

#### Certification and publishing resources

Use these links to take a customized workload through certification and publication:

| Topic | Description |
|-------|-------------|
| [Publishing overview](https://learn.microsoft.com/en-us/fabric/extensibility-toolkit/publishing-overview) | The two publishing scenarios (internal vs. cross-tenant) and the end-to-end flow. |
| [General publishing requirements](https://learn.microsoft.com/en-us/fabric/extensibility-toolkit/publishing-requirements-general) | Baseline requirements for all workloads — Entra custom domain, app registration, manifest, hosting, and security. |
| [Publishing requirements (overview)](https://learn.microsoft.com/en-us/fabric/extensibility-toolkit/publishing-requirements-overview) | Full set of certification requirements for Workload Hub distribution, plus prerequisites and the publishing process. |
| [Publishing requirements for workloads](https://learn.microsoft.com/en-us/fabric/extensibility-toolkit/publishing-requirements-workload) | Workload-level functionality, reliability, compliance, and documentation standards. |
| [Publishing requirements for items](https://learn.microsoft.com/en-us/fabric/extensibility-toolkit/publishing-requirements-item) | Item-level UX, data handling, accessibility, and lifecycle standards. |
| [Vendor attestation template](https://learn.microsoft.com/en-us/fabric/extensibility-toolkit/publishing-vendor-attestation-template) | Template for the compliance attestation document referenced by `AttestationUrl` in your manifest. |
| [Manifest overview](https://learn.microsoft.com/en-us/fabric/extensibility-toolkit/manifest-overview) | How to prepare the manifest package that is validated, certified, and published. |
| [Validate your workload for publishing](https://learn.microsoft.com/en-us/fabric/extensibility-toolkit/tutorial-validate-workload) | Run the official validation tool to catch compliance issues before submission. |
| [Upload / publish a workload](https://learn.microsoft.com/en-us/fabric/extensibility-toolkit/tutorial-publish-workload) | Step-by-step upload through the Fabric Admin Portal and workload-name registration. |
| [Publishing Request Form](https://aka.ms/fabric_workload_publishing) | Submit your workload to Microsoft to move to Preview and then General Availability. |

## Resources

Here are all the resources included and referenced. These documents provide additional information and can serve as a reference:

- [OneLake](https://learn.microsoft.com/en-us/fabric/onelake/onelake-overview)
- [One Lake APIs](https://learn.microsoft.com/en-us/fabric/onelake/onelake-access-api)
- [Monitoring Hub Configuration Guide](https://learn.microsoft.com/en-us/fabric/workload-development-kit/monitoring-hub)
- [Publishing overview (Extensibility Toolkit)](https://learn.microsoft.com/en-us/fabric/extensibility-toolkit/publishing-overview)
- [General publishing requirements](https://learn.microsoft.com/en-us/fabric/extensibility-toolkit/publishing-requirements-general)
