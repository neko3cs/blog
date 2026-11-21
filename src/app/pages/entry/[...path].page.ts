import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { EntryArticle } from '../../entry-article';

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
  // /entry/2020/03/30/002449 → "2020/03/30/002449"。content/entry/ 以下のファイルパスと一致する。
  // Analog は catch-all を親子のルートに分けて登録するため、ルートからすべての URL 断片を連結する。
  readonly path = inject(ActivatedRoute)
    .pathFromRoot.flatMap((route) => route.snapshot.url.map((segment) => segment.path))
    .slice(1)
    .join('/');
}
