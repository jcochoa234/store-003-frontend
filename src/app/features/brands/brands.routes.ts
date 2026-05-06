import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';

export const BRANDS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/brand-list/brand-list.component').then(
            (m) => m.BrandListComponent
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./pages/brand-detail/brand-detail.component').then(
            (m) => m.BrandDetailComponent
          ),
      },
    ],
  },
];
