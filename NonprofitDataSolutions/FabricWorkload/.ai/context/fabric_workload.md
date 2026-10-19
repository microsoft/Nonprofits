## Project Setup & Management

This is a Microsoft Fabric Workload Development Kit (WDK v2) project for creating custom workloads that integrate with the Microsoft Fabric platform. The project follows a specific structure where:

- **Workload code** is located in the `Workload/` directory (TypeScript/React frontend)
- **Manifest configuration** is located in the `config/Manifest/` directory
- **Build and deployment scripts** are located in the `scripts/` directory
- **AI automation tasks** will be added in the `.ai/commands/` directory

### Key Configuration Files

- `config/Manifest/WorkloadManifest.xml` - Main workload configuration
- `config/Manifest/Product.json` - Product definition
- `config/DevGateway/workload-dev-mode.json` - Development gateway configuration
- `Workload/package.json` - Frontend dependencies and build scripts

## Code Structure

The project is organized into several key directories:

### `/Workload/` - Frontend Application

- **Purpose**: Contains the React/TypeScript frontend application that users interact with
- **Key files**:
  - `package.json` - Dependencies and npm scripts
  - `tsconfig.json` - TypeScript configuration
  - `app/` - Source code for the React application (customer implementation area)
  - `devServer/` - Development server configuration
  - `.env.dev`, `.env.prod`, `.env.test` - Environment configurations

#### `/Workload/app/` - Customer Implementation Area

This is where customers should place their custom workload code. The structure includes:

- **`items/`** - Contains all item implementations that the workload provides
  - Each item in this folder must correspond to a `*Item.xml` file in `config/Manifest/`
  - **`HelloWorld/`** - Out-of-the-box Hello World item implementation that can be modified or replaced
  - Custom item folders should follow the same pattern as HelloWorld
  - Item implementations define the UI, logic, and behavior for each workload item type

- **`playground/`** - Demonstration area showing how workload features work
  - Contains examples and proof-of-concept implementations
  - Helps developers understand the workload patterns and APIs
  - Can be safely deleted if not needed for the final workload

- **`samples/`** - Additional reference implementations and views
  - Provides examples of different item types and UI patterns
  - Shows best practices for implementing common workload scenarios
  - Includes sample views and components that can be adapted for custom needs
  - Serves as a learning resource for workload development patterns

### `/config/Manifest/` - Workload Configuration

- **Purpose**: Contains all manifest files that define the workload for Fabric
- **Key files**:
  - `WorkloadManifest.xml` - Main workload configuration (hosting type, endpoints, AAD apps). This file is used to let Fabric know which items exist. It contains the hosting information.
  - `Product.json` - Product metadata and definitions which is used by the Fabric Frontend. This contains basic information about workload and items e.g. names and descriptions as well as the entry definitions in the frontend the item should participate.
  - `*Item.json` and `*Item.xml` - Item type definitions (e.g., HelloWorldItem)
  - `*.xsd` files - XML schema definitions for validation
  - `ManifestPackage.nuspec` - NuGet package specification for deployment which will be built automatically based on the files in the directory

### `/scripts/` - Automation Scripts

- **Purpose**: PowerShell scripts for building, deploying, and running the workload
- **Structure**:
  - `Build/` - Building manifest packages and releases
  - `Deploy/` - Deployment automation
  - `Run/` - Development server startup scripts
  - `Setup/` - Initial setup and configuration scripts

### `/release/` - Build Output

- **Purpose**: Contains built artifacts ready for deployment
- **Contents**: Compiled frontend assets and packaged manifest files

### `/.ai/commands/` - AI Automation Tasks

- **Purpose**: Location for AI-specific task definitions and automation commands
- **Usage**: AI tools should reference this directory for available automation tasks

## Documentation Standards

- All configuration changes should be documented in the respective JSON/XML files
- PowerShell scripts should include comment-based help
- TypeScript code should follow JSDoc conventions
- README files should be updated when major structural changes occur

## Preferred Packages

### Frontend Dependencies (from package.json)

- **UI Framework**: `@fluentui/react` and `@fluentui/react-components` - Microsoft's Fluent UI
- **Workload Integration**: `@ms-fabric/workload-client` - Core Fabric workload client library
- **State Management**: `@reduxjs/toolkit` and `react-redux`
- **Routing**: `react-router-dom`
- **Internationalization**: `i18next` and `react-i18next`

### Development Tools

- **TypeScript**: Primary language for frontend development
- **Webpack**: Module bundler and development server
- **Sass**: CSS preprocessing
- **env-cmd**: Environment variable management

## Best Practices

### Manifest Configuration

1. Always update both XML and JSON manifest files when changing workload definitions
2. Ensure AAD application IDs are correctly configured in `WorkloadManifest.xml`
3. Test manifest changes using the development gateway before deployment
4. Version increments should be reflected in both manifest and package files

### Frontend Development

1. Use the provided npm scripts for consistent builds (`npm run start`, `npm run build:prod`)
2. Follow Fluent UI design patterns for consistency with Fabric
3. Utilize the `@ms-fabric/workload-client` library for proper Fabric integration
4. Environment-specific configurations should use the appropriate `.env.*` files

### Script Usage

1. Use PowerShell scripts in the `scripts/` directory for automation
2. `scripts/Run/StartDevGateway.ps1` - Start the development gateway
3. `scripts/Build/BuildManifestPackage.ps1` - Build manifest packages
4. `scripts/Deploy/Deploy.ps1` - Deploy to Fabric environment

### AI Tool Integration

1. AI tools should understand the relationship between `Workload/app/` (implementation) and `config/Manifest/` (configuration)
2. When adding new workload items:
   - Create item implementation in `Workload/app/items/[ItemName]/`
   - Add corresponding `[ItemName]Item.xml` in `config/Manifest/`
   - Update `Product.json` with item metadata for Fabric Frontend
3. Use `Workload/app/samples/` and `Workload/app/playground/` as reference for implementation patterns
4. Use the scripts in `scripts/` directory for automation tasks
5. Future AI commands will be stored in `.ai/commands/` directory

## Commands Reference

### NPM Scripts (run from `/Workload/` directory)

```bash
npm run start                # Start development server
npm run start:devServer      # Start dev server with environment
npm run start:devGateway     # Start development gateway
npm run build:test           # Build for testing
npm run build:prod           # Build for production
```

### PowerShell Scripts (run from project root)

```powershell
# Development
.\scripts\Run\StartDevGateway.ps1     # Start dev gateway
.\scripts\Run\StartDevServer.ps1      # Start frontend dev server

# Building
.\scripts\Build\BuildManifestPackage.ps1  # Build manifest package
.\scripts\Build\BuildRelease.ps1           # Build full release

# Deployment
.\scripts\Deploy\Deploy.ps1               # Deploy to Fabric
```

### Key Directories for AI Tools

- **Code modifications**: `Workload/app/`
- **Configuration changes**: `config/Manifest/`
- **Build automation**: `scripts/Build/`
- **Development workflow**: `scripts/Run/`
- **Future AI tasks**: `.ai/commands/`
