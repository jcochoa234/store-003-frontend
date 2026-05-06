import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

/**
 * Empty state for list page tables. Used as the content of [nzNoResult].
 * Shows a different message + action depending on whether filters are active.
 *
 * Usage inside a list template:
 *   <ng-template #emptyTemplate>
 *     <app-empty-state
 *       entityName="Category"
 *       [hasActiveFilters]="hasActiveFilters"
 *       [canCreate]="canCreate"
 *       (clearFilters)="clearAllFilters()"
 *       (create)="openFormModal()">
 *     </app-empty-state>
 *   </ng-template>
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [LowerCasePipe, NzButtonModule, NzIconModule],
  template: `
    <div class="empty-state">
      <span nz-icon nzType="inbox" class="empty-icon"></span>
      @if (hasActiveFilters) {
        <p>No {{ entityName | lowercase }}s match your filters.</p>
        <button nz-button nzType="link" (click)="clearFilters.emit()">Clear all filters</button>
      } @else {
        <p>No {{ entityName | lowercase }}s yet.</p>
        @if (canCreate) {
          <button nz-button nzType="primary" (click)="create.emit()">
            <span nz-icon nzType="plus"></span>
            New {{ entityName }}
          </button>
        }
      }
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 0;
      color: rgba(0,0,0,0.45);
    }
    .empty-icon {
      font-size: 48px;
      margin-bottom: 12px;
      opacity: 0.4;
    }
    p { margin: 0 0 8px; font-size: 14px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  @Input({ required: true }) entityName!: string;
  @Input() hasActiveFilters = false;
  @Input() canCreate        = false;

  @Output() clearFilters = new EventEmitter<void>();
  @Output() create       = new EventEmitter<void>();
}
