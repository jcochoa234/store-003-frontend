import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';

export const CATEGORIES_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/category-list/category-list.component').then(
            (m) => m.CategoryListComponent
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./pages/category-detail/category-detail.component').then(
            (m) => m.CategoryDetailComponent
          ),
      },
    ],
  },
];
