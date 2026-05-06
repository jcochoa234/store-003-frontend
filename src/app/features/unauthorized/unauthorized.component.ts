import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { KeycloakService } from '../../core/auth/keycloak.service';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink, NzResultModule, NzButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
      <nz-result
        nzStatus="403"
        nzTitle="403"
        nzSubTitle="You do not have permission to access this page.">
        <div nz-result-extra>
          <button nz-button nzType="primary" routerLink="/dashboard">
            Back to home
          </button>
          <button nz-button (click)="logout()" style="margin-left: 8px;">
            Sign out
          </button>
        </div>
      </nz-result>
    </div>
  `,
})
export class UnauthorizedComponent {
  private readonly keycloak = inject(KeycloakService);
  logout(): void { this.keycloak.logout(); }
}
