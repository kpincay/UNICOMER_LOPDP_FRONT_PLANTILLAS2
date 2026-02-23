# ═══════════════════════════════════════════════
# Multi-stage build for .NET 9 Web API
# ═══════════════════════════════════════════════

# --- Build Stage ---
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore
COPY src/PlantillasApp/PlantillasApp.csproj src/PlantillasApp/
RUN dotnet restore src/PlantillasApp/PlantillasApp.csproj

# Copy all source and build
COPY src/ src/
RUN dotnet publish src/PlantillasApp/PlantillasApp.csproj -c Release -o /app/publish

# --- Runtime Stage ---
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Non-root user for security
RUN adduser --disabled-password --gecos "" appuser
USER appuser

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

ENTRYPOINT ["dotnet", "PlantillasApp.dll"]
