# DevGateway Container

This guide provides instructions on how to run the Fabric DevGateway in a container.
The dockerfile downloads the Fabric DevGateway and runs a script which validates the environment variables and ensures the required files are properly mounted to the container.

## Prerequisites

Before you begin, ensure you have the following installed:

- Docker
- Docker Compose

> For developers using Apple Silicon processors(M-Series), make sure you enable `Use Rosetta for x86/amd64 on Apple Silicon` in Docker.

## Getting Started

### 1. Set the Environment Variables

Copy the `sample.env` file, rename it to `.env`, update the values as needed and set the variables.

```bash
cp sample.env .env
```

| Variable Name                | Description                                                                   |
| ---------------------------- | ----------------------------------------------------------------------------- |
| `ENTRA_TENANT_ID`            | Fabric instance's Tenant ID                                                   |
| `DEV_WORKSPACE_ID`           | User's Workspace ID                                                           |
| `MANIFEST_PACKAGE_FILE_PATH` | Path to the Fabric workload backend `ManifestPackage.1.0.0.nupkg` build file. |
| `LOCAL_BACKEND_PORT`         | Fabric workload backend port. Default: `5000`                                 |
| `LOG_LEVEL`                  | DevGateway application log level. Default: `Information`                      |

### 2. Build and run the Docker Image

Run the following command to build and run the Docker image:

```sh
docker compose up --build
```

### 3. Authenticate to the DevGateway

Once the container is up and running, follow the prompts in the terminal to authenticate to Fabric.

### 4. Shutting things down

Stop the running container and remove containers and networks by running the command below.

```bash
docker compose down
```

However, since the terminal is attached to the running container, you have to open a new terminal from the `DevGateway` folder to execute the command. You can also shutdown the container gracefully with `Ctrl + C`.
