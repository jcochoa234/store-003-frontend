import { Injectable } from '@angular/core';

/**
 * Generates and triggers a CSV file download.
 *
 * Usage:
 *   this.csvExport.download(
 *     `entities-page${this.currentPage}.csv`,
 *     ['Name', 'Status'],
 *     this.pagedData().items.map(e => [e.name, e.status]),
 *   );
 */
@Injectable({ providedIn: 'root' })
export class CsvExportService {
  download(
    filename: string,
    headers: string[],
    rows: (string | number | null | undefined)[][],
  ): void {
    const csvRows = rows.map(row =>
      row.map(cell => {
        const val = String(cell ?? '');
        return `"${val.replace(/"/g, '""')}"`;
      }).join(','),
    );
    const csv  = [headers.join(','), ...csvRows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
