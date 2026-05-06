import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from './keycloak.service';

/**
 * Protects routes that require authentication.
 * If the user is not authenticated, redirects to Keycloak login.
 */
export const authGuard: CanActivateFn = () => {
  const keycloak = inject(KeycloakService);
  const router = inject(Router);

  if (keycloak.isAuthenticated()) {
    return true;
  }

  keycloak.login();
  return router.createUrlTree(['/unauthorized']);
};
