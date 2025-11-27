# Build and deploy a Dataverse solution

The [Common Data Model for Nonprofits](../CommonDataModelforNonprofits/README.md), [Fundraising](../Fundraising/README.md), [Grant Management](../GrantManagement/README.md), [Outcome Management](../OutcomeManagement/README.md), and [Volunteer Management](../VolunteerManagement/README.md) are solutions built on Dataverse. The process to build and deploy is the same for each of these solutions. 

This repository contains multiple Dataverse solutions. Always ensure you are in the correct solution folder.
Follow the steps below to **build and deploy the solution** into a Power Platform environment.

---

## 📌 Prerequisites

Before building or deploying a Dataverse solution, ensure you have the following installed:

### 🛠 Required Software

| Tool                                                      | Version      | Installation Link                                                                                    |
| --------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| [.NET SDK](https://dotnet.microsoft.com/en-us/download)   | 4.6.2 or later | [Install Guide](https://learn.microsoft.com/en-us/dotnet/core/install/windows)                              |
| [.NET ](https://dotnet.microsoft.com/en-us/download)   | Latest | [Install Guide](https://learn.microsoft.com/en-us/dotnet/core/install/windows)                              |
| [Power Platform CLI](https://aka.ms/pac)                  | Latest       | [Install Guide](https://learn.microsoft.com/en-us/power-platform/developer/howto/install-cli-net-tool?tabs=windows)         |
| [Node.js ](https://nodejs.org/en)                  | 18.18.0 or later       | [Install Guide](https://nodejs.org/en/download/)         |



### 🔑 Authentication Requirements

- A **Dataverse environment** with necessary permissions.
- A **Power Platform Service Principal** or a **Dataverse user account** with **Solution Import/Export permissions**.
- A **valid authentication method** for `pac auth create` (e.g., username/password, client ID & secret, certificate-based auth).

### 🏛 Required Data Model
Before installing Fundraising, Outcome Management, Grant Management, or any other nonprofit solutions based on Dataverse, ensure that the Common Data Model (CDM) for Nonprofits is installed first.

This ensures compatibility and proper data structure alignment for all dependent solutions.

---

# ⚙️ **Build Instructions**

Follow these steps to **build the solution** using .NET and Power Platform CLI.

### 1️⃣ **Open the Command Prompt**
- On **Windows**, press `Win + R`, type `cmd`, and hit `Enter`.
- Alternatively, open **PowerShell** by pressing `Win + X`, then selecting **Windows Terminal**.

### 2️⃣ **Find the correct solution**

- This repository contains multiple solutions. Ensure you navigate to the correct solution directory by replacing the SOLUTION_NAME with the correct name of the solution.

```sh
cd SOLUTION_NAME
```


### 3️⃣ **Restore Dependencies**

```sh
dotnet restore
```

### 4️⃣ **Build the CDS Project**

For creating an **unmanaged** solution, run:
```sh
dotnet build
```

For creating a **managed** solution, run:
```sh
dotnet build --configuration Release
```
This will build the solution and prepare files for deployment to your Power Platform environment.

### 📂 **Solution Files Location**
- **Unmanaged Solution**: *SOLUTION_NAME.zip* is created in `bin/Debug`.
- **Managed Solution**: *SOLUTION_NAME_managed.zip* is created in `bin/Release`.

---

# 🚀 **Deployment Instructions**

### 1 **Authenticate to Power Platform**

Run the following command to authenticate:

```sh
pac auth create
```

### 2 **Import the Solution**

Run one of the following commands to import the solution into your Dataverse environment. Replace SOLUTION_NAME with the solution name that you would like to import and YOUR_ENVIRONMENT_URL with your Power Platform environment url. 


- **Import Unmanaged Solution**:
  ```sh
  pac solution import --path bin/Debug/SOLUTION_NAME.zip --environment https://YOUR_ENVIRONMENT_URL --publish-changes
  ```
  Use `--publish-changes` to ensure all changes are applied in Dataverse when importing an unmanaged solution. 


- **Import Managed Solution**:
  ```sh
  pac solution import --path bin/Release/SOLUTION_NAME_managed.zip --environment https://YOUR_ENVIRONMENT_URL
  ```


### 3 **Verify Solution Import**
After importing the solution, verify that it is successfully imported:

1. Navigate to [**Power Apps Maker Portal**](https://make.powerapps.com).
2. Select the **environment** where you imported the solution (top-right corner).
3. In the left navigation menu, click on **Solutions**.
4. Search for the correct **SOLUTION_NAME** in the solution list.
5. If the solution appears with a **status of "Managed" or "Unmanaged"**, the import was successful.

If the solution is not listed or has errors, check the **Import History** for details.

---

## ✅ **Troubleshooting**

- **Authentication issues?**

  - Run `pac auth list` to verify authentication.
  - Use `pac auth delete --index <number>` to remove incorrect auth profiles.

- **Build errors?**

  - Ensure you have installed the correct .NET SDK version (`dotnet --version`).
  - Check that all dependencies are installed using `dotnet restore`.

- **Import issues?**

  - Ensure you have the correct permissions in Power Platform.
  - Verify the solution file path.

---

## 📝 **Additional Resources**

- [Power Platform CLI Documentation](https://learn.microsoft.com/en-us/power-platform/developer/cli/introduction)
- [Power Platform ALM Best Practices](https://learn.microsoft.com/en-us/power-platform/alm/devops-build-tools)

---

### 🎯 **You're Ready to Build and Deploy!**

If you have any questions, feel free to create an issue in the repository. 🚀
