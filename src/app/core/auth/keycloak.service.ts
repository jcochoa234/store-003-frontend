import { Injectable, signal, computed } from '@angular/core';
import Keycloak from 'keycloak-js';
import { environment } from '@environments/environment';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  roles: string[];
}

/**
 * Wraps keycloak-js and exposes Angular-friendly reactive state via signals.
 * Handles initialization, token refresh, login/logout, and role checks.
 */
@Injectable({ providedIn: 'root' })
export class KeycloakService {
  private readonly _keycloak = new Keycloak({
    url: environment.keycloak.url,
    realm: environment.keycloak.realm,
    clientId: environment.keycloak.clientId,
  });

  private readonly _isAuthenticated = signal(false);
  private readonly _profile = signal<UserProfile | null>(null);

  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly profile = this._profile.asReadonly();
  readonly username = computed(() => this._profile()?.username ?? '');
  readonly fullName = computed(() => this._profile()?.fullName ?? '');
  readonly roles = computed(() => this._profile()?.roles ?? []);

  /**
   * Called by APP_INITIALIZER — initializes Keycloak and loads profile.
   */
  async init(): Promise<void> {
    const authenticated = await this._keycloak.init({
      onLoad: 'login-required',
      checkLoginIframe: false,
      pkceMethod: 'S256',
    });

    this._isAuthenticated.set(authenticated);

    if (authenticated) {
      await this._loadProfile();
      this._scheduleTokenRefresh();
    }
  }

  getToken(): string | undefined {
    return this._keycloak.token;
  }

  async refreshToken(): Promise<boolean> {
    return this._keycloak.updateToken(30);
  }

  login(): void {
    this._keycloak.login();
  }

  logout(): void {
    this._keycloak.logout({ redirectUri: window.location.origin });
  }

  hasRole(role: string): boolean {
    return this._keycloak.hasRealmRole(role);
  }

  hasAnyRole(...roles: string[]): boolean {
    return roles.some((r) => this._keycloak.hasRealmRole(r));
  }

  /** Checks if the user has at least one of the required roles for a policy */
  canAccess(policy: 'it' | 'supervisor' | 'standard'): boolean {
    switch (policy) {
      case 'it':
        return this.hasRole('it');
      case 'supervisor':
        return this.hasAnyRole('it', 'supervisor');
      case 'standard':
        return this.hasAnyRole('it', 'supervisor', 'standard');
    }
  }

  private async _loadProfile(): Promise<void> {
    const profile = await this._keycloak.loadUserProfile();
    const realmRoles: string[] =
      (this._keycloak.tokenParsed as Record<string, unknown> & { realm_access?: { roles?: string[] } })
        ?.realm_access?.roles ?? [];

    this._profile.set({
      id: profile.id ?? '',
      username: profile.username ?? '',
      email: profile.email ?? '',
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      fullName: `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim(),
      roles: realmRoles,
    });
  }

  /** Silently refreshes token 30 seconds before expiry */
  private _scheduleTokenRefresh(): void {
    setInterval(async () => {
      try {
        await this._keycloak.updateToken(30);
      } catch {
        this.login();
      }
    }, 60_000);
  }
}
