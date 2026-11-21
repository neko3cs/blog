import { Component, OnInit } from '@angular/core';

import { injectSeo } from '../seo';

/**
 * 404 ページ。どのルートにも当てはまらないURLで表示される。
 * プリレンダーで /404 として 404.html に出力し、Cloudflare が存在しないURLに対してステータス 404 で返す。
 * 404.html はどのURLでも返されるため、ブラウザで Angular を起動するとハイドレーションが合わなくなる。
 * そのため vite.config.ts で 404.html から JS の読み込みを取り除いている。
 */
@Component({
  template: `
    <main class="bg-bg-card px-6 py-24 md:py-32">
      <div class="mx-auto max-w-[692px] text-center">
        <p class="apple-eyebrow">404 Not Found</p>
        <h1 class="mt-3 text-[28px] leading-[1.25] font-bold md:text-[40px] md:leading-[1.2]">
          ページが見つかりませんでした
        </h1>
        <p class="mt-6 text-[17px] text-text-sub">URLが間違っているか、ページが移動または削除された可能性があります。</p>
        <div class="mt-10 flex flex-wrap justify-center gap-6">
          <a href="/" class="apple-link">トップへ</a>
          <a href="/archive" class="apple-link">記事一覧へ</a>
        </div>
      </div>
    </main>
  `,
})
export default class NotFoundPage implements OnInit {
  private readonly applySeo = injectSeo();

  ngOnInit(): void {
    this.applySeo({ title: 'Not Found', path: '/404', noindex: true });
  }
}
