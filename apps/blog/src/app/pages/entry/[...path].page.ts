import { Component } from '@angular/core';

import { EntryArticle } from '../../entry-article';
import { injectRouteSegments } from '../../route-segments';

@Component({
  imports: [EntryArticle],
  template: `
    <main>
      <!--
        記事は静的なので、ブラウザでは再実行（ハイドレーション）しない。
        本文・Markdown 変換・シンタックスハイライトの JS はブラウザに送られない。
      -->
      @defer (hydrate never) {
        <app-entry-article [path]="path" />
      }
    </main>
  `,
})
export default class EntryPage {
  // /entry/2020/03/30/002449 → "2020/03/30/002449"。content/entry/ 以下のファイルパスと一致する
  readonly path = injectRouteSegments().slice(1).join('/');
}
