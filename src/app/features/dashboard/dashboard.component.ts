import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { MediatorService } from '../../core/mediator/mediator.service';
import { FormModalService } from '../../shared/services/form-modal.service';
import { KeycloakService } from '../../core/auth/keycloak.service';
import { GetAllCategoriesQuery } from '../categories/queries/get-all-categories/get-all-categories.query';
import { GetAllCategoriesHandler } from '../categories/queries/get-all-categories/get-all-categories.handler';
import { GetProductsQuery } from '../products/queries/get-products/get-products.query';
import { GetProductsHandler } from '../products/queries/get-products/get-products.handler';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    NzCardModule,
    NzGridModule,
    NzIconModule,
    NzDividerModule,
    NzButtonModule,
    NzTagModule,
    NzAvatarModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly mediator      = inject(MediatorService);
  private readonly titleService  = inject(Title);
  private readonly formModal     = inject(FormModalService);
  readonly keycloak              = inject(KeycloakService);

  totalCategories = signal(0);
  totalProducts   = signal(0);

  ngOnInit(): void {
    this.titleService.setTitle('Dashboard | Store 003');
    this._loadStats();
  }

  getInitials(): string {
    const name = this.keycloak.fullName();
    if (!name) return 'U';
    return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
  }

  openNewCategory(): void {
    this.formModal.open(
      () => import('../categories/pages/category-form/category-form.component').then(m => m.CategoryFormComponent),
      { title: 'New Category' },
    ).subscribe(saved => { if (saved) this._loadStats(); });
  }

  openNewProduct(): void {
    this.formModal.open(
      () => import('../products/pages/product-form/product-form.component').then(m => m.ProductFormComponent),
      { title: 'New Product', width: 600 },
    ).subscribe(saved => { if (saved) this._loadStats(); });
  }

  private _loadStats(): void {
    // page:1, pageSize:1 — we only need totalCount from the response
    this.mediator
      .send(new GetAllCategoriesQuery(1, 1), GetAllCategoriesHandler)
      .subscribe((result) => {
        result.match(
          (data) => this.totalCategories.set(data.totalCount),
          () => {}
        );
      });

    this.mediator
      .send(new GetProductsQuery({ page: 1, pageSize: 1 }), GetProductsHandler)
      .subscribe((result) => {
        result.match(
          (data) => this.totalProducts.set(data.totalCount),
          () => {}
        );
      });
  }
}
