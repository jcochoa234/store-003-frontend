import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { NzPageHeaderModule, NzPageHeaderBreadcrumbDirective } from 'ng-zorro-antd/page-header';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { RouterLink } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';

export interface Breadcrumb {
  label: string;
  link?: string;
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NzPageHeaderModule, NzPageHeaderBreadcrumbDirective, NzBreadCrumbModule, RouterLink, NgTemplateOutlet],
  template: `
    <nz-page-header [nzTitle]="title" [nzSubtitle]="subtitle">
      <nz-breadcrumb nz-page-header-breadcrumb>
        @for (crumb of breadcrumbs; track crumb.label) {
          <nz-breadcrumb-item>
            @if (crumb.link) {
              <a [routerLink]="crumb.link">{{ crumb.label }}</a>
            } @else {
              {{ crumb.label }}
            }
          </nz-breadcrumb-item>
        }
      </nz-breadcrumb>

      @if (extraTemplate) {
        <nz-page-header-extra>
          <ng-container [ngTemplateOutlet]="extraTemplate"></ng-container>
        </nz-page-header-extra>
      }
    </nz-page-header>
  `,
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() breadcrumbs: Breadcrumb[] = [];
  @Input() extraTemplate: import('@angular/core').TemplateRef<unknown> | null = null;
}
