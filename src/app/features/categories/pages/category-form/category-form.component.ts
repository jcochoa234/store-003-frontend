import { Component, OnInit, DestroyRef, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import { NotifyService } from '../../../../shared/services/notify.service';
import { MediatorService } from '../../../../core/mediator/mediator.service';
import { CustomValidators } from '../../../../shared/validators/custom-validators';
import { StatusDataPolicy, STATUS_OPTIONS } from '../../../../core/models/status-data-policy.enum';
import { FormActionsComponent } from '../../../../shared/components/form-actions/form-actions.component';
import { CharCounterComponent } from '../../../../shared/components/char-counter/char-counter.component';
import { CreateCategoryCommand } from '../../commands/create-category/create-category.command';
import { CreateCategoryHandler } from '../../commands/create-category/create-category.handler';
import { UpdateCategoryCommand } from '../../commands/update-category/update-category.command';
import { UpdateCategoryHandler } from '../../commands/update-category/update-category.handler';
import { GetCategoryByIdQuery } from '../../queries/get-category-by-id/get-category-by-id.query';
import { GetCategoryByIdHandler } from '../../queries/get-category-by-id/get-category-by-id.handler';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSpinModule,
    NzSelectModule,
    FormActionsComponent,
    CharCounterComponent,
  ],
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryFormComponent implements OnInit {
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
  categoryId = signal<string | null>(null);

  nameLength = signal(0);
  descLength = signal(0);

  readonly NAME_MAX = 150;
  readonly DESC_MAX = 500;

  readonly statusOptions = STATUS_OPTIONS;

  ngOnInit(): void {
    this._buildForm();
    this._setupCharCounters();

    const id = this.data?.id;
    if (id) {
      this.isEditMode.set(true);
      this.categoryId.set(id);
      this._loadCategory(id);
    }
  }

  private _buildForm(): void {
    this.form = this.fb.group({
      name:        ['', [Validators.required, Validators.maxLength(this.NAME_MAX), CustomValidators.notWhiteSpace()]],
      description: ['', [Validators.maxLength(this.DESC_MAX)]],
      status:      [StatusDataPolicy.Active, [Validators.required]],
    });
  }

  private _setupCharCounters(): void {
    this.form.get('name')!.valueChanges.pipe(startWith(''), takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.nameLength.set((v || '').length));
    this.form.get('description')!.valueChanges.pipe(startWith(''), takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.descLength.set((v || '').length));
  }

  private _loadCategory(id: string): void {
    this.loading.set(true);
    this.mediator.send(new GetCategoryByIdQuery(id), GetCategoryByIdHandler)
      .subscribe(result => {
        result.match(
          (category) => {
            this.form.patchValue({
              name:        category.name,
              description: category.description,
              status:      category.status ?? StatusDataPolicy.Active,
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
    const { name, description, status } = this.form.value;

    if (this.isEditMode()) {
      this.mediator.send(new UpdateCategoryCommand({ id: this.categoryId()!, name, description, status }), UpdateCategoryHandler)
        .subscribe(result => {
          result.match(
            () => { this.form.markAsPristine(); this.notify.updated('Category'); this.modalRef.close(true); },
            (err) => this.notify.error(err),
          );
          this.submitting.set(false);
        });
    } else {
      this.mediator.send(new CreateCategoryCommand({ name, description, status }), CreateCategoryHandler)
        .subscribe(result => {
          result.match(
            () => { this.form.markAsPristine(); this.notify.created('Category'); this.modalRef.close(true); },
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
