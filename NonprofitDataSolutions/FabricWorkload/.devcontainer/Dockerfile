FROM mcr.microsoft.com/dotnet/aspnet:8.0

# Install mono-complete
RUN apt-get update && apt-get install -y mono-complete && \
    rm -rf /var/lib/apt/lists/*