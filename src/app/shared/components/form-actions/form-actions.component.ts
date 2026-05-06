import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';

/**
 * Standard Cancel / Submit action row for modal forms.
 * The submit button uses type="submit" so it fires the parent form's (ngSubmit).
 * The cancel button emits (cancelled) — the parent handles the dirty-check logic.
 *
 * Usage (at the bottom of a modal form template):
 *   <app-form-actions
 *     [submitting]="submitting()"
 *     [isEditMode]="isEditMode()"
 *     (cancelled)="cancel()">
 *   </app-form-actions>
 */
@Component({
  selector: 'app-form-actions',
  standalone: true,
  imports: [NzButtonModule, NzFormModule],
  template: `
    <nz-form-item style="margin-bottom: 0;">
      <nz-form-control>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button nz-button nzType="default" type="button" (click)="cancelled.emit()">
            Cancel
          </button>
          <button nz-button nzType="primary" type="submit" [nzLoading]="submitting">
            {{ isEditMode ? 'Update' : 'Create' }}
          </button>
        </div>
      </nz-form-control>
    </nz-form-item>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormActionsComponent {
  @Input() submitting = false;
  @Input() isEditMode = false;

  @Output() cancelled = new EventEmitter<void>();
}
