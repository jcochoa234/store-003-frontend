import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { KeycloakService } from '../auth/keycloak.service';

/**
 * Attaches the Keycloak Bearer token to every outgoing HTTP request.
 * Attempts to refresh the token if it's about to expire (< 30 seconds).
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const keycloak = inject(KeycloakService);

  return from(keycloak.refreshToken()).pipe(
    switchMap(() => {
      const token = keycloak.getToken();
      if (!token) {
        return next(req);
      }

      const authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });

      return next(authReq);
    })
  );
};
