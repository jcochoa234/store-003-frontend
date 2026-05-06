import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { KeycloakService } from './keycloak.service';
import { roleGuard } from './role.guard';

/** Helper: execute the functional guard in a TestBed injection context. */
function runGuard(policy: 'it' | 'supervisor' | 'standard'): boolean | UrlTree {
  return TestBed.runInInjectionContext(() =>
    roleGuard(policy)(
      {} as ActivatedRouteSnapshot,
      {} as RouterStateSnapshot,
    )
  ) as boolean | UrlTree;
}

describe('roleGuard', () => {
  let keycloakSpy: jasmine.SpyObj<KeycloakService>;
  let router: Router;

  beforeEach(() => {
    keycloakSpy = jasmine.createSpyObj('KeycloakService', ['canAccess']);

    TestBed.configureTestingModule({
      providers: [
        { provide: KeycloakService, useValue: keycloakSpy },
      ],
    });

    router = TestBed.inject(Router);
  });

  describe('policy: "it"', () => {
    it('returns true when user has the "it" role', () => {
      keycloakSpy.canAccess.and.returnValue(true);
      expect(runGuard('it')).toBeTrue();
      expect(keycloakSpy.canAccess).toHaveBeenCalledWith('it');
    });

    it('redirects to /unauthorized when user lacks the "it" role', () => {
      keycloakSpy.canAccess.and.returnValue(false);
      const result = runGuard('it');
      expect(result instanceof UrlTree).toBeTrue();
      expect(router.serializeUrl(result as UrlTree)).toBe('/unauthorized');
    });
  });

  describe('policy: "supervisor"', () => {
    it('returns true when canAccess("supervisor") is true', () => {
      keycloakSpy.canAccess.and.returnValue(true);
      expect(runGuard('supervisor')).toBeTrue();
    });

    it('redirects to /unauthorized when canAccess("supervisor") is false', () => {
      keycloakSpy.canAccess.and.returnValue(false);
      expect(runGuard('supervisor') instanceof UrlTree).toBeTrue();
    });
  });

  describe('policy: "standard"', () => {
    it('returns true for standard users', () => {
      keycloakSpy.canAccess.and.returnValue(true);
      expect(runGuard('standard')).toBeTrue();
    });
  });
});
