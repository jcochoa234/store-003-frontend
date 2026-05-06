import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/product-list/product-list.component').then(
            (m) => m.ProductListComponent
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./pages/product-detail/product-detail.component').then(
            (m) => m.ProductDetailComponent
          ),
      },
    ],
  },
];
