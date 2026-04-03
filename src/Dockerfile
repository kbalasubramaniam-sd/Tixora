# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project files first (for layer caching)
COPY Tixora.Domain/Tixora.Domain.csproj Tixora.Domain/
COPY Tixora.Application/Tixora.Application.csproj Tixora.Application/
COPY Tixora.Infrastructure/Tixora.Infrastructure.csproj Tixora.Infrastructure/
COPY Tixora.API/Tixora.API.csproj Tixora.API/

# Restore
RUN dotnet restore Tixora.API/Tixora.API.csproj

# Copy everything and publish
COPY . .
RUN dotnet publish Tixora.API/Tixora.API.csproj -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .

# Create uploads directory for document storage
RUN mkdir -p /app/uploads

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "Tixora.API.dll"]
