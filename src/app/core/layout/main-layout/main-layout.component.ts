import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { KeycloakService } from '../../auth/keycloak.service';
import { HttpLoadingService } from '../../http/http-loading.service';
import { ThemeService } from '../../theme/theme.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NzLayoutModule,
    NzIconModule,
    NzDropDownModule,
    NzAvatarModule,
    NzMenuModule,
    NzBadgeModule,
    NzDrawerModule,
    NzToolTipModule,
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  private readonly keycloak = inject(KeycloakService);
  readonly httpLoading = inject(HttpLoadingService);
  readonly theme       = inject(ThemeService);

  readonly profile  = this.keycloak.profile;
  readonly fullName = this.keycloak.fullName;
  readonly roles    = this.keycloak.roles;

  mobileMenuOpen    = signal(false);
  notificationCount = signal(3); // Example value — replace with real notification count

  getInitials(): string {
    const name = this.fullName();
    if (!name) return 'U';
    return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
  }

  logout(): void {
    this.keycloak.logout();
  }
}
