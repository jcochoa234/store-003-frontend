import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DetailActionsComponent } from '../../../../shared/components/detail-actions/detail-actions.component';
import { Title } from '@angular/platform-browser';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NotifyService } from '../../../../shared/services/notify.service';
import { FormModalService } from '../../../../shared/services/form-modal.service';
import { MediatorService } from '../../../../core/mediator/mediator.service';
import { KeycloakService } from '../../../../core/auth/keycloak.service';
import { PageHeaderComponent, Breadcrumb } from '../../../../shared/components/page-header/page-header.component';
import { LoadingContainerComponent } from '../../../../shared/components/loading-container/loading-container.component';
import { StatusTagComponent } from '../../../../shared/components/status-tag/status-tag.component';
import { CategoryDto } from '../../models/category.model';
import { GetCategoryByIdQuery } from '../../queries/get-category-by-id/get-category-by-id.query';
import { GetCategoryByIdHandler } from '../../queries/get-category-by-id/get-category-by-id.handler';
import { DeleteCategoryCommand } from '../../commands/delete-category/delete-category.command';
import { DeleteCategoryHandler } from '../../commands/delete-category/delete-category.handler';
import { GetProductsQuery } from '../../../products/queries/get-products/get-products.query';
import { GetProductsHandler } from '../../../products/queries/get-products/get-products.handler';

@Component({
  selector: 'app-category-detail',
  standalone: true,
  imports: [
    RouterLink,
    NzDescriptionsModule,
    NzIconModule,
    NzCardModule,
    PageHeaderComponent,
    DetailActionsComponent,
    LoadingContainerComponent,
    StatusTagComponent,
  ],
  templateUrl: './category-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryDetailComponent implements OnInit {
  private readonly mediator  = inject(MediatorService);
  private readonly notify    = inject(NotifyService);
  private readonly formModal = inject(FormModalService);
  private readonly route     = inject(ActivatedRoute);
  private readonly router    = inject(Router);
  private readonly keycloak  = inject(KeycloakService);
  private readonly titleSvc  = inject(Title);

  category     = signal<CategoryDto | null>(null);
  productCount = signal(0);
  loading      = signal(false);

  readonly canEdit   = this.keycloak.canAccess('supervisor');
  readonly canDelete = this.keycloak.canAccess('it');

  get breadcrumbs(): Breadcrumb[] {
    return [
      { label: 'Home',       link: '/dashboard' },
      { label: 'Categories', link: '/categories' },
      { label: this.category()?.name ?? 'Detail' },
    ];
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this._loadCategory(id);
  }

  private _loadCategory(id: string): void {
    this.loading.set(true);
    this.mediator
      .send(new GetCategoryByIdQuery(id), GetCategoryByIdHandler)
      .subscribe((result) => {
        result.match(
          (data) => {
            this.category.set(data);
            this.titleSvc.setTitle(`${data.name} | Store 003`);
            this._loadProductCount(id);
          },
          (err) => {
            this.notify.error(err);
            this.router.navigate(['/categories']);
          }
        );
        this.loading.set(false);
      });
  }

  private _loadProductCount(categoryId: string): void {
    this.mediator
      .send(new GetProductsQuery({ page: 1, pageSize: 1, categoryIds: [categoryId] }), GetProductsHandler)
      .subscribe((result) => {
        result.match(
          (data) => this.productCount.set(data.totalCount),
          () => {}
        );
      });
  }

  openEditModal(): void {
    const id = this.category()?.id;
    if (!id) return;
    this.formModal.open(
      () => import('../../pages/category-form/category-form.component').then(m => m.CategoryFormComponent),
      { title: 'Edit Category', data: { id } },
    ).subscribe(saved => { if (saved) this._loadCategory(id); });
  }

  delete(): void {
    const id = this.category()?.id;
    if (!id) return;
    this.mediator
      .send(new DeleteCategoryCommand(id), DeleteCategoryHandler)
      .subscribe((result) => {
        result.match(
          () => {
            this.notify.deleted('Category');
            this.router.navigate(['/categories']);
          },
          (err) => this.notify.error(err)
        );
      });
  }
}
