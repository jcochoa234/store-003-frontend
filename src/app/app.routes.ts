import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  // Unauthorized — public page
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/unauthorized/unauthorized.component').then(
        (m) => m.UnauthorizedComponent
      ),
  },

  // Protected app routes inside the main layout
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'categories',
        loadChildren: () =>
          import('./features/categories/categories.routes').then(
            (m) => m.CATEGORIES_ROUTES
          ),
      },
      {
        path: 'products',
        loadChildren: () =>
          import('./features/products/products.routes').then(
            (m) => m.PRODUCTS_ROUTES
          ),
      },
      {
        path: 'suppliers',
        loadChildren: () =>
          import('./features/suppliers/suppliers.routes').then(m => m.SUPPLIERS_ROUTES),
      },
    ],
  },

  // 404 — inside main layout so the header/nav is visible
  {
    path: '404',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/not-found/not-found.component').then(
            (m) => m.NotFoundComponent
          ),
      },
    ],
  },

  // Fallback
  { path: '**', redirectTo: '404' },
];
