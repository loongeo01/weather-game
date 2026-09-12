FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY weatherIconsAPI.csproj .
RUN dotnet restore weatherIconsAPI.csproj

COPY . .
RUN dotnet publish weatherIconsAPI.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://0.0.0.0:10000

EXPOSE 10000

ENTRYPOINT ["dotnet", "weatherIconsAPI.dll"]