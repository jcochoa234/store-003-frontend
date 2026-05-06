import {
  ApplicationConfig,
  APP_INITIALIZER,
  ErrorHandler,
  provideZoneChangeDetection,
  importProvidersFrom,
  LOCALE_ID,
} from '@angular/core';
import { DATE_PIPE_DEFAULT_OPTIONS } from '@angular/common';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideNzI18n, en_US } from 'ng-zorro-antd/i18n';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import {
  DashboardOutline,
  TagsOutline,
  InboxOutline,
  ShoppingOutline,
  MenuFoldOutline,
  MenuUnfoldOutline,
  UserOutline,
  LogoutOutline,
  PlusOutline,
  EditOutline,
  DeleteOutline,
  EyeOutline,
  SearchOutline,
  ArrowRightOutline,
  ArrowLeftOutline,
  DownOutline,
  SafetyCertificateOutline,
  BellOutline,
  MenuOutline,
  CloseCircleOutline,
  CloseOutline,
  DollarOutline,
  CaretUpFill,
  CaretDownFill,
  DownloadOutline,
  BulbOutline,
  BulbFill,
  TeamOutline,
  ShopOutline,
} from '@ant-design/icons-angular/icons';
import { routes } from './app.routes';
import { GlobalErrorHandler } from './core/error/global-error.handler';
import { KeycloakService } from './core/auth/keycloak.service';
import { keycloakInitFactory } from './core/auth/keycloak-init.factory';
import { authInterceptor } from './core/http/auth.interceptor';
import { errorInterceptor } from './core/http/error.interceptor';
import { correlationIdInterceptor } from './core/http/correlation-id.interceptor';
import { loadingInterceptor } from './core/http/loading.interceptor';

const NZ_ICONS = [
  DashboardOutline,
  TagsOutline,
  InboxOutline,
  ShoppingOutline,
  MenuFoldOutline,
  MenuUnfoldOutline,
  UserOutline,
  LogoutOutline,
  PlusOutline,
  EditOutline,
  DeleteOutline,
  EyeOutline,
  SearchOutline,
  ArrowRightOutline,
  ArrowLeftOutline,
  DownOutline,
  SafetyCertificateOutline,
  BellOutline,
  MenuOutline,
  CloseCircleOutline,
  CloseOutline,
  DollarOutline,
  CaretUpFill,
  CaretDownFill,
  DownloadOutline,
  BulbOutline,
  BulbFill,
  ShopOutline,
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(
      withInterceptors([
        loadingInterceptor,
        correlationIdInterceptor,
        authInterceptor,
        errorInterceptor,
      ])
    ),
    provideAnimations(),
    provideNzI18n(en_US),
    importProvidersFrom(NzModalModule),
    { provide: LOCALE_ID, useValue: 'en-US' },
    { provide: DATE_PIPE_DEFAULT_OPTIONS, useValue: { timezone: 'America/Phoenix' } },
    provideNzIcons(NZ_ICONS),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },

    // Initialize Keycloak before the app renders
    {
      provide: APP_INITIALIZER,
      useFactory: keycloakInitFactory,
      deps: [KeycloakService],
      multi: true,
    },
  ],
};
