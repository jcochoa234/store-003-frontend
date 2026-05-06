import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';

/**
 * Standard action buttons for detail pages: Back, Edit (role-gated), Delete (role-gated).
 * Intended for use inside the #headerExtra template of app-page-header.
 *
 * Usage:
 *   <ng-template #headerExtra>
 *     <app-detail-actions
 *       backLink="/categories"
 *       [showEdit]="canEdit && !!category()"
 *       [showDelete]="canDelete && !!category()"
 *       deleteTitle="Delete this category?"
 *       (edit)="openEditModal()"
 *       (deleted)="delete()">
 *     </app-detail-actions>
 *   </ng-template>
 */
@Component({
  selector: 'app-detail-actions',
  standalone: true,
  imports: [RouterLink, NzButtonModule, NzIconModule, NzSpaceModule, NzPopconfirmModule],
  template: `
    <nz-space>
      <button *nzSpaceItem nz-button nzType="default" [routerLink]="backLink">
        <span nz-icon nzType="arrow-left"></span>
        Back
      </button>
      @if (showEdit) {
        <button *nzSpaceItem nz-button nzType="default" (click)="edit.emit()">
          <span nz-icon nzType="edit"></span>
          Edit
        </button>
      }
      @if (showDelete) {
        <button *nzSpaceItem nz-button nzDanger
                nz-popconfirm
                [nzPopconfirmTitle]="deleteTitle"
                nzPopconfirmPlacement="bottomRight"
                (nzOnConfirm)="deleted.emit()">
          <span nz-icon nzType="delete"></span>
          Delete
        </button>
      }
    </nz-space>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailActionsComponent {
  @Input({ required: true }) backLink!: string;
  @Input() showEdit   = false;
  @Input() showDelete = false;
  @Input() deleteTitle = 'Delete this item?';

  @Output() edit    = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();
}
