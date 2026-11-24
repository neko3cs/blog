import { Component } from '@angular/core';

import { ArchiveView } from '../../archive-view';

@Component({
  imports: [ArchiveView],
  template: `
    <main>
      @defer (hydrate never) {
        <app-archive-view [filter]="{ kind: 'all' }" path="/archive" />
      }
    </main>
  `,
})
export default class ArchivePage {}
