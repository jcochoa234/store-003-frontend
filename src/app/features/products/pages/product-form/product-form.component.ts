import { Component, OnInit, DestroyRef, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import { NotifyService } from '../../../../shared/services/notify.service';
import { MediatorService } from '../../../../core/mediator/mediator.service';
import { CustomValidators } from '../../../../shared/validators/custom-validators';
import { StatusDataPolicy, STATUS_OPTIONS } from '../../../../core/models/status-data-policy.enum';
import { FormActionsComponent } from '../../../../shared/components/form-actions/form-actions.component';
import { CharCounterComponent } from '../../../../shared/components/char-counter/char-counter.component';
import { CategoryDto } from '../../../categories/models/category.model';
import { GetAllCategoriesQuery } from '../../../categories/queries/get-all-categories/get-all-categories.query';
import { GetAllCategoriesHandler } from '../../../categories/queries/get-all-categories/get-all-categories.handler';
import { BrandDto } from '../../../brands/models/brand.model';
import { GetBrandsQuery } from '../../../brands/queries/get-brands/get-brands.query';
import { GetBrandsHandler } from '../../../brands/queries/get-brands/get-brands.handler';
import { CreateProductCommand } from '../../commands/create-product/create-product.command';
import { CreateProductHandler } from '../../commands/create-product/create-product.handler';
import { UpdateProductCommand } from '../../commands/update-product/update-product.command';
import { UpdateProductHandler } from '../../commands/update-product/update-product.handler';
import { GetProductByIdQuery } from '../../queries/get-product-by-id/get-product-by-id.query';
import { GetProductByIdHandler } from '../../queries/get-product-by-id/get-product-by-id.handler';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzButtonModule,
    NzSpinModule,
    NzGridModule,
    FormActionsComponent,
    CharCounterComponent,
  ],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFormComponent implements OnInit {
  private readonly fb         = inject(FormBuilder);
  private readonly mediator   = inject(MediatorService);
  private readonly notify     = inject(NotifyService);
  private readonly modalRef   = inject(NzModalRef);
  private readonly confirm    = inject(ConfirmService);
  private readonly destroyRef = inject(DestroyRef);
  readonly data: { id?: string } = inject(NZ_MODAL_DATA);

  form!: FormGroup;
  loading    = signal(false);
  submitting = signal(false);
  isEditMode = signal(false);
  productId  = signal<string | null>(null);
  categories = signal<CategoryDto[]>([]);
  brands     = signal<BrandDto[]>([]);
  nameLength = signal(0);

  readonly NAME_MAX = 150;

  readonly statusOptions = STATUS_OPTIONS;

  ngOnInit(): void {
    this._buildForm();
    this._setupCharCounters();
    this._loadCategories();
    this._loadBrands();

    const id = this.data?.id;
    if (id) {
      this.isEditMode.set(true);
      this.productId.set(id);
      this._loadProduct(id);
    }
  }

  private _buildForm(): void {
    this.form = this.fb.group({
      name:       ['',   [Validators.required, Validators.maxLength(this.NAME_MAX), CustomValidators.notWhiteSpace()]],
      price:      [null, [Validators.required, CustomValidators.positiveOrZero()]],
      categoryId: [null, [Validators.required]],
      brandId:    [null],
      status:     [StatusDataPolicy.Active, [Validators.required]],
    });
  }

  private _setupCharCounters(): void {
    this.form.get('name')!.valueChanges.pipe(startWith(''), takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.nameLength.set((v || '').length));
  }

  private _loadCategories(): void {
    this.mediator.send(new GetAllCategoriesQuery(1, 100), GetAllCategoriesHandler)
      .subscribe(result => result.match(
        (data) => this.categories.set(data.items),
        (err)  => this.notify.error(err),
      ));
  }

  private _loadBrands(): void {
    this.mediator.send(new GetBrandsQuery(1, 100), GetBrandsHandler)
      .subscribe(result => result.match(
        (data) => this.brands.set(data.items),
        ()     => {},
      ));
  }

  private _loadProduct(id: string): void {
    this.loading.set(true);
    this.mediator.send(new GetProductByIdQuery(id), GetProductByIdHandler)
      .subscribe(result => {
        result.match(
          (product) => {
            this.form.patchValue({
              name:       product.name,
              price:      product.price,
              categoryId: product.categoryId,
              brandId:    product.brandId ?? null,
              status:     product.status ?? StatusDataPolicy.Active,
            });
            this.form.markAsPristine();
          },
          (err) => { this.notify.error(err); this.modalRef.close(false); }
        );
        this.loading.set(false);
      });
  }

  submit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => { c.markAsDirty(); c.updateValueAndValidity({ onlySelf: true }); });
      return;
    }

    this.submitting.set(true);
    const { name, price, categoryId, brandId, status } = this.form.value;

    if (this.isEditMode()) {
      this.mediator.send(new UpdateProductCommand({ id: this.productId()!, name, price, categoryId, brandId: brandId ?? undefined, status }), UpdateProductHandler)
        .subscribe(result => {
          result.match(
            () => { this.form.markAsPristine(); this.notify.updated('Product'); this.modalRef.close(true); },
            (err) => this.notify.error(err),
          );
          this.submitting.set(false);
        });
    } else {
      this.mediator.send(new CreateProductCommand({ name, price, categoryId, brandId: brandId ?? undefined, status }), CreateProductHandler)
        .subscribe(result => {
          result.match(
            () => { this.form.markAsPristine(); this.notify.created('Product'); this.modalRef.close(true); },
            (err) => this.notify.error(err),
          );
          this.submitting.set(false);
        });
    }
  }

  cancel(): void {
    if (!this.form?.dirty) { this.modalRef.close(false); return; }
    this.confirm.discardChanges().subscribe(() => this.modalRef.close(false));
  }
}
