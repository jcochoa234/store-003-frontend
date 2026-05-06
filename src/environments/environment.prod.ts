export const environment = {
  production: true,
  // Replace with your real production API URL before deploying
  apiUrl: 'https://api.yourdomain.com/api/v1',
  keycloak: {
    // Replace with your real production Keycloak URL
    url: 'https://keycloak.pinnacleaerospace.com',
    realm: 'pinnacle-dev',
    clientId: 'global-client-dev',
  },
  features: {
    enableExport: true,
    enableNotifications: false,
  },
};
