import { Component } from '@angular/core';

// 型は import type で分ける。部品と同じ import 文にすると、@defer の遅延読み込みの対象から外れてブラウザに送られてしまう
import type { ArchiveFilter } from '../../../../archive-view';
import { ArchiveView } from '../../../../archive-view';
import { injectRouteSegments } from '../../../../route-segments';

/** /archive/2024/08/15。はてなブログの日別アーカイブも検索結果に載っているため、同じURLで用意する */
@Component({
  imports: [ArchiveView],
  template: `
    <main>
      @defer (hydrate never) {
        <app-archive-view [filter]="filter" [path]="'/archive/' + year + '/' + month + '/' + day" />
      }
    </main>
  `,
})
export default class DayArchivePage {
  private readonly segments = injectRouteSegments();
  protected readonly year = this.segments[1];
  protected readonly month = this.segments[2];
  protected readonly day = this.segments[3];
  protected readonly filter: ArchiveFilter = { kind: 'day', year: this.year, month: this.month, day: this.day };
}
