import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSpaceModule } from 'ng-zorro-antd/space';

/**
 * Standardized View / Edit / Delete action button group for table rows.
 *
 * Replaces the repeated nz-space + three-button block found in every list page.
 * Encapsulates the popconfirm for delete so callers only handle the confirmed event.
 *
 * Usage:
 *   <app-table-row-actions
 *     [viewLink]="[entity.id]"
 *     [showEdit]="canCreate"
 *     [showDelete]="canDelete"
 *     [deleteTitle]="'Delete &quot;' + entity.name + '&quot;?'"
 *     entityLabel="category"
 *     (edit)="openFormModal(entity.id)"
 *     (deleted)="deleteCategory(entity.id)">
 *   </app-table-row-actions>
 */
@Component({
  selector: 'app-table-row-actions',
  standalone: true,
  imports: [
    RouterLink,
    NzButtonModule,
    NzIconModule,
    NzToolTipModule,
    NzPopconfirmModule,
    NzSpaceModule,
  ],
  template: `
    <nz-space>
      <button
        *nzSpaceItem
        nz-button
        nzType="default"
        nzSize="small"
        nz-tooltip
        nzTooltipTitle="View detail"
        [attr.aria-label]="'View ' + entityLabel + ' detail'"
        [routerLink]="viewLink">
        <span nz-icon nzType="eye"></span>
      </button>

      @if (showEdit) {
        <button
          *nzSpaceItem
          nz-button
          nzType="default"
          nzSize="small"
          nz-tooltip
          nzTooltipTitle="Edit"
          [attr.aria-label]="'Edit ' + entityLabel"
          (click)="edit.emit()">
          <span nz-icon nzType="edit"></span>
        </button>
      }

      @if (showDelete) {
        <button
          *nzSpaceItem
          nz-button
          nzDanger
          nzSize="small"
          nz-tooltip
          nzTooltipTitle="Delete"
          [attr.aria-label]="'Delete ' + entityLabel"
          nz-popconfirm
          [nzPopconfirmTitle]="deleteTitle"
          nzPopconfirmPlacement="left"
          (nzOnConfirm)="deleted.emit()">
          <span nz-icon nzType="delete"></span>
        </button>
      }
    </nz-space>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableRowActionsComponent {
  /** Router link for the View button. Accepts the same formats as [routerLink]. */
  @Input() viewLink: string | any[] = [];
  /** Whether the Edit button is visible. */
  @Input() showEdit = false;
  /** Whether the Delete button is visible. */
  @Input() showDelete = false;
  /** Popconfirm title shown before the delete action. */
  @Input() deleteTitle = 'Delete this item?';
  /** Entity name used in aria-labels (e.g. "category", "product"). */
  @Input() entityLabel = 'item';

  /** Emits when the Edit button is clicked. */
  @Output() edit    = new EventEmitter<void>();
  /** Emits when the delete popconfirm is confirmed. */
  @Output() deleted = new EventEmitter<void>();
}
