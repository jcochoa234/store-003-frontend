import { Routes } from '@angular/router';
import { authGuard } from '@core/auth/auth.guard';

export const SUPPLIERS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/supplier-list/supplier-list.component').then(m => m.SupplierListComponent),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./pages/supplier-detail/supplier-detail.component').then(m => m.SupplierDetailComponent),
      },
    ],
  },
];
