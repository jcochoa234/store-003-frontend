import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, NzResultModule, NzButtonModule],
  template: `
    <div class="not-found-wrapper">
      <nz-result
        nzStatus="404"
        nzTitle="404"
        nzSubTitle="The page you're looking for doesn't exist.">
        <div nz-result-extra>
          <button nz-button nzType="primary" routerLink="/dashboard">Back to Dashboard</button>
        </div>
      </nz-result>
    </div>
  `,
  styles: [`
    .not-found-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 56px - 44px);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {}
