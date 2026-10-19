# Use the official .NET 6.0 runtime as the base image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app

# DevGateway download link in Microsoft Download Center
ARG DEV_GATEWAY_DOWNLOAD_URL=https://download.microsoft.com/download/c/4/a/c4a0a569-87cd-4633-a81e-26ef3d4266df/DevGateway.zip

# Combine RUN commands to reduce layers
RUN apt-get update && apt-get install -y curl sudo unzip && \
    curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash && \
    curl ${DEV_GATEWAY_DOWNLOAD_URL} -O && \
    unzip -o DevGateway.zip -d DevGateway && \
    rm -rf DevGateway.zip && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /var/cache/apt/*

COPY entrypoint.sh ./

# Create a non-root user and switch to that user
RUN useradd -m clippy && \
    chown clippy:clippy ./entrypoint.sh && \
    chmod u+x ./entrypoint.sh

USER clippy

ENTRYPOINT ["./entrypoint.sh"]