import { KeycloakService } from './keycloak.service';

/**
 * APP_INITIALIZER factory — initializes Keycloak before the app renders.
 * Registered in app.config.ts.
 */
export function keycloakInitFactory(keycloak: KeycloakService): () => Promise<void> {
  return () => keycloak.init();
}
