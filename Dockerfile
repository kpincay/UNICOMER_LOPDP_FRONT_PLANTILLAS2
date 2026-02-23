# Multi-stage build for .NET 9 Web API
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY src/PlantillasApp/PlantillasApp.csproj src/PlantillasApp/
RUN dotnet restore src/PlantillasApp/PlantillasApp.csproj

COPY src/ src/
RUN dotnet publish src/PlantillasApp/PlantillasApp.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

ENTRYPOINT ["dotnet", "PlantillasApp.dll"]
