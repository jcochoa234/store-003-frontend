import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { STATUS_OPTIONS } from '@core/models/status-data-policy.enum';

/**
 * Standardized Status form field for modal forms.
 *
 * Encapsulates the nz-form-item / nz-form-label / nz-form-control / nz-select
 * block that appears in every entity form. Accepts the reactive FormControl
 * directly so it integrates with any FormGroup without a ControlValueAccessor.
 *
 * Usage (inside a [formGroup]="form"):
 *   <app-status-form-field [control]="asControl(form.get('status'))">
 *   </app-status-form-field>
 *
 * TypeScript helper (add to the component):
 *   asControl(c: AbstractControl | null): FormControl {
 *     return c as FormControl;
 *   }
 */
@Component({
  selector: 'app-status-form-field',
  standalone: true,
  imports: [ReactiveFormsModule, NzFormModule, NzSelectModule],
  template: `
    <nz-form-item>
      <nz-form-label nzRequired>Status</nz-form-label>
      <nz-form-control [nzErrorTip]="statusError">
        <nz-select [formControl]="control" nzPlaceHolder="Select status">
          @for (opt of statusOptions; track opt.value) {
            <nz-option [nzValue]="opt.value" [nzLabel]="opt.label"></nz-option>
          }
        </nz-select>
        <ng-template #statusError let-ctrl>
          @if (ctrl.hasError('required')) { Status is required. }
        </ng-template>
      </nz-form-control>
    </nz-form-item>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusFormFieldComponent {
  /** The reactive FormControl for the status field (must use Validators.required). */
  @Input({ required: true }) control!: FormControl;

  readonly statusOptions = STATUS_OPTIONS;
}
