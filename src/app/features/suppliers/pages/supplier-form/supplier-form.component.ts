import { Component, OnInit, DestroyRef, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, FormControl } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { MediatorService } from '@core/mediator/mediator.service';
import { StatusDataPolicy } from '@core/models/status-data-policy.enum';
import { CustomValidators } from '@shared/validators/custom-validators';
import { NotifyService } from '@shared/services/notify.service';
import { ConfirmService } from '@shared/services/confirm.service';
import { CanDeactivateComponent } from '@shared/guards/can-deactivate.interface';
import { FormActionsComponent } from '@shared/components/form-actions/form-actions.component';
import { CharCounterComponent } from '@shared/components/char-counter/char-counter.component';
import { StatusFormFieldComponent } from '@shared/components/status-form-field/status-form-field.component';
import { CreateSupplierCommand } from '../../commands/create-supplier/create-supplier.command';
import { CreateSupplierHandler } from '../../commands/create-supplier/create-supplier.handler';
import { UpdateSupplierCommand } from '../../commands/update-supplier/update-supplier.command';
import { UpdateSupplierHandler } from '../../commands/update-supplier/update-supplier.handler';
import { GetSupplierByIdQuery } from '../../queries/get-supplier-by-id/get-supplier-by-id.query';
import { GetSupplierByIdHandler } from '../../queries/get-supplier-by-id/get-supplier-by-id.handler';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSpinModule,
    NzGridModule,
    FormActionsComponent,
    CharCounterComponent,
    StatusFormFieldComponent,
  ],
  templateUrl: './supplier-form.component.html',
  styleUrls: ['./supplier-form.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierFormComponent implements OnInit, CanDeactivateComponent {
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
  supplierId = signal<string | null>(null);
  nameLength = signal(0);

  readonly NAME_MAX = 150;
  readonly EMAIL_MAX = 254;

  ngOnInit(): void {
    this._buildForm();
    this._setupCharCounters();

    const id = this.data?.id;
    if (id) {
      this.isEditMode.set(true);
      this.supplierId.set(id);
      this._loadSupplier(id);
    }
  }

  asControl(c: AbstractControl | null): FormControl { return c as FormControl; }

  private _buildForm(): void {
    this.form = this.fb.group({
      name:         ['', [Validators.required, Validators.maxLength(this.NAME_MAX), CustomValidators.notWhiteSpace()]],
      contactEmail: ['', [Validators.required, Validators.maxLength(this.EMAIL_MAX), Validators.email]],
      phone:        ['', [Validators.required, Validators.maxLength(50)]],
      status:       [StatusDataPolicy.Active, [Validators.required]],
    });
  }

  private _setupCharCounters(): void {
    this.form.get('name')!.valueChanges
      .pipe(startWith(''), takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.nameLength.set((v || '').length));
  }

  private _loadSupplier(id: string): void {
    this.loading.set(true);
    this.mediator.send(new GetSupplierByIdQuery(id), GetSupplierByIdHandler)
      .subscribe(result => {
        result.match(
          supplier => {
            this.form.patchValue({
              name:         supplier.name,
              contactEmail: supplier.contactEmail,
              phone:        supplier.phone,
              status:       supplier.status ?? StatusDataPolicy.Active,
            });
            this.form.markAsPristine();
          },
          err => { this.notify.error(err); this.modalRef.close(false); },
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
    const { name, contactEmail, phone, status } = this.form.value;

    if (this.isEditMode()) {
      this.mediator.send(new UpdateSupplierCommand({ id: this.supplierId()!, name, contactEmail, phone, status }), UpdateSupplierHandler)
        .subscribe(result => {
          result.match(
            () => { this.form.markAsPristine(); this.notify.updated('Supplier'); this.modalRef.close(true); },
            err => this.notify.error(err),
          );
          this.submitting.set(false);
        });
    } else {
      this.mediator.send(new CreateSupplierCommand({ name, contactEmail, phone, status }), CreateSupplierHandler)
        .subscribe(result => {
          result.match(
            () => { this.form.markAsPristine(); this.notify.created('Supplier'); this.modalRef.close(true); },
            err => this.notify.error(err),
          );
          this.submitting.set(false);
        });
    }
  }

  cancel(): void {
    if (!this.form?.dirty) { this.modalRef.close(false); return; }
    this.confirm.discardChanges().subscribe(() => this.modalRef.close(false));
  }

  hasUnsavedChanges(): boolean {
    return this.form?.dirty === true && !this.submitting();
  }
}
