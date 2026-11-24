import { Component } from '@angular/core';

// 型は import type で分ける。部品と同じ import 文にすると、@defer の遅延読み込みの対象から外れてブラウザに送られてしまう
import type { ArchiveFilter } from '../../../archive-view';
import { ArchiveView } from '../../../archive-view';
import { injectRouteSegments } from '../../../route-segments';
import { categoryPath } from '../../../../lib/site';

/**
 * /archive/category/C%23
 * カテゴリ名に「/」を含むもの（ローコード/ノーコード）があるため catch-all で受ける。
 */
@Component({
  imports: [ArchiveView],
  template: `
    <main>
      @defer (hydrate never) {
        <app-archive-view [filter]="filter" [path]="path" />
      }
    </main>
  `,
})
export default class CategoryArchivePage {
  private readonly name = decodeOnceMore(injectRouteSegments().slice(2).join('/'));
  protected readonly path = categoryPath(this.name);
  protected readonly filter: ArchiveFilter = { kind: 'category', name: this.name };
}

/**
 * プリレンダー時、Nitro は「C%23」のようなパスをもう一度エンコードして（C%2523）リクエストするため、
 * ルーターがデコードした後も「C%23」が残る。もう一度デコードして「C#」に戻す。
 * ブラウザから来た URL はすでにデコード済みなので、何も変わらない。
 */
function decodeOnceMore(name: string): string {
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}
