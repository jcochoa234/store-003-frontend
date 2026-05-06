import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from './keycloak.service';

/**
 * Role-based guard factory — mirrors the authorization policies from the .NET API.
 *
 * Usage in routes:
 *   canActivate: [roleGuard('supervisor')]  // requires 'it' or 'supervisor'
 *   canActivate: [roleGuard('it')]          // requires 'it'
 */
export function roleGuard(policy: 'it' | 'supervisor' | 'standard'): CanActivateFn {
  return () => {
    const keycloak = inject(KeycloakService);
    const router = inject(Router);

    if (keycloak.canAccess(policy)) {
      return true;
    }

    return router.createUrlTree(['/unauthorized']);
  };
}
