import { Component } from '@angular/core';

// 型は import type で分ける。部品と同じ import 文にすると、@defer の遅延読み込みの対象から外れてブラウザに送られてしまう
import type { ArchiveFilter } from '../../../archive-view';
import { ArchiveView } from '../../../archive-view';
import { injectRouteSegments } from '../../../route-segments';

/** /archive/2024 */
@Component({
  imports: [ArchiveView],
  template: `
    <main>
      @defer (hydrate never) {
        <app-archive-view [filter]="filter" [path]="'/archive/' + year" />
      }
    </main>
  `,
})
export default class YearArchivePage {
  protected readonly year = injectRouteSegments()[1];
  protected readonly filter: ArchiveFilter = { kind: 'year', year: this.year };
}
