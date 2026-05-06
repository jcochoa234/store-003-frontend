export const environment = {
  production: false,
  // API runs on port 8080 via docker-compose (or 5273 running locally)
  //apiUrl: 'http://localhost:8080/api/v1',
  apiUrl: 'http://localhost:5273/api/v1',
  keycloak: {
    url: 'https://keycloak.pinnacleaerospace.com',
    realm: 'pinnacle-dev',
    clientId: 'global-client-dev',
  },
  features: {
    enableExport: true,
    enableNotifications: false,
  },
};
