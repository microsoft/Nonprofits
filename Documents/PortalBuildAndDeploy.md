# 🚀 Power Apps Portal Deployment Guide

This guide provides step-by-step instructions to deploy a **Power Platform Portal** from a local environment using the Power Platform CLI (`pac`).

## 📌 Prerequisites

Before deploying a Power Platform Portal solution, ensure you have the following installed:

### 🛠 Required Software

| Tool                                                      | Version      | Installation Link                                                                                    |
| --------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| [Power Platform CLI](https://aka.ms/pac)                  | Latest       | [Install Guide](https://learn.microsoft.com/en-us/power-platform/developer/howto/install-cli-net-tool?tabs=windows)         |

### ⚙️ Environment configuration
- Make sure you have Disabled [Enhanced Data Model](https://learn.microsoft.com/en-us/power-pages/admin/enhanced-data-model#disable-the-enhanced-data-model) for your environment in the Power Platform admin center.
- Create an empty website from https://make.powerpages.microsoft.com/.
This is required to provide infrastructure for portal data to be imported.

### 🔑 Authentication Requirements

- A **Dataverse environment** with necessary permissions.
- A **Power Platform Service Principal** or a **Dataverse user account** with **Solution Import/Export permissions**.
- A **valid authentication method** for `pac auth create` (e.g., username/password, client ID & secret, certificate-based auth).

## 📋 **Deploy Instructions**

### 1.  **Authenticate to Power Platform**

Run the following command to authenticate:

  ```sh
  pac auth create
  ```

### 2. **Deploy the Portal**
  ```sh
  pac powerpages upload --path PORTAL_FOLDER_PATH --modelVersion 1
  ```

### 3. **Verify Portal Deployed**
After deploying the solution, verify that it is successfully deployed:
  ```sh
  pac powerpages list
  ```
Your solution should be displayed in the list.

### 4. **Prepare Configuration Data package**
- Navigate to ./Portal/ConfigData folder under your Portal solution.
- Create zip archive including:
  - **data_schema.xml**
  - **[Content_Types].xml**
  - **data.xml** (you will find it in the folder indicated by specific language code).

### 5. **Open Configuration Migration Tool**
  ```sh
  pac tool CMT
  ```

### 6. **Import Prepared Configuration Zip**
Using [Configuration Migration Tool](https://learn.microsoft.com/en-us/power-platform/admin/import-configuration-data#import-configuration-data-1) which is opened by PAC CLI, import configuration to your environment.

## ✅ **Troubleshooting**

- **Authentication Issues?**

  - Run `pac auth list` to verify authentication.
  - Use `pac auth delete --index <number>` to remove incorrect auth profiles.

- **Deploy Issues?**

  - Ensure you have the correct permissions in Power Platform.
  - Verify the portal folder path.
  - Make sure Enhanced Data Model is Disabled for your environment.

## 📝 **Additional Resources**

- [Disable Enhanced Data Model](https://learn.microsoft.com/en-us/power-pages/admin/enhanced-data-model#disable-the-enhanced-data-model)
- [Use Microsoft Power Platform CLI with Power Pages](https://learn.microsoft.com/en-us/power-pages/configure/power-platform-cli-tutorial)
- [Import Configuration Data](https://learn.microsoft.com/en-us/power-platform/admin/import-configuration-data#import-configuration-data-1)

## 🎯 **You're Ready Deploy!**

If you have any questions, feel free to create an issue in the repository. 🚀