import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { SearchInputComponent } from '../search-input/search-input.component';

/**
 * Filter toolbar for list pages. Encapsulates:
 *   - Search input (left side)
 *   - Results count, "Clear all" button, and "Export CSV" button (right side)
 *
 * The parent is responsible for debouncing (searchValueChange feeds a Subject).
 *
 * Usage:
 *   <app-list-toolbar
 *     placeholder="Search categories..."
 *     [searchValue]="searchValue"
 *     (searchValueChange)="onSearch($event)"
 *     (searchCleared)="clearSearch()"
 *     [totalCount]="pagedData().totalCount"
 *     [hasActiveFilters]="hasActiveFilters"
 *     [canExport]="enableExport && pagedData().items.length > 0"
 *     (clearAll)="clearAllFilters()"
 *     (exportData)="exportCsv()">
 *   </app-list-toolbar>
 */
@Component({
  selector: 'app-list-toolbar',
  standalone: true,
  imports: [NzButtonModule, NzIconModule, NzToolTipModule, SearchInputComponent],
  template: `
    <div class="filter-bar">
      <div class="filter-bar__left">
        <app-search-input
          [placeholder]="placeholder"
          [value]="searchValue"
          (valueChange)="searchValueChange.emit($event)"
          (cleared)="searchCleared.emit()">
        </app-search-input>
        <ng-content></ng-content>
      </div>
      <div class="filter-bar__right">
        @if (hasActiveFilters) {
          <span class="results-hint">
            {{ totalCount }} result{{ totalCount !== 1 ? 's' : '' }} found
          </span>
          <button nz-button nzType="link" nzSize="small" (click)="clearAll.emit()">
            <span nz-icon nzType="close-circle"></span>
            Clear all
          </button>
        }
        @if (canExport) {
          <button nz-button nzSize="small" (click)="exportData.emit()"
                  nz-tooltip nzTooltipTitle="Export current page as CSV">
            <span nz-icon nzType="download"></span>
            Export CSV
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; margin-bottom: 8px; }

    .filter-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .filter-bar__left {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      flex: 1;
      min-width: 0;
    }
    .filter-bar__right {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }
    .results-hint {
      font-size: 13px;
      color: rgba(0,0,0,0.45);
      white-space: nowrap;
    }

    @media (max-width: 767px) {
      .filter-bar { flex-direction: column; align-items: stretch; }
      .filter-bar__left, .filter-bar__right { width: 100%; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListToolbarComponent {
  @Input() placeholder      = 'Search...';
  @Input() searchValue      = '';
  @Input() totalCount       = 0;
  @Input() hasActiveFilters = false;
  @Input() canExport        = false;

  @Output() searchValueChange = new EventEmitter<string>();
  @Output() searchCleared     = new EventEmitter<void>();
  @Output() clearAll          = new EventEmitter<void>();
  @Output() exportData        = new EventEmitter<void>();
}
