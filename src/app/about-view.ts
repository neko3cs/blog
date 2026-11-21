import { Component, inject, OnInit, PendingTasks, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import fm from 'front-matter';

import { entrySummaries } from './entry-index';
import { injectSeo } from './seo';

// ?analog-content-file=true を付けると、Analog がビルド時に Markdown を HTML に変換する
const aboutFile = import.meta.glob<string>('/content/about.md', {
  query: '?analog-content-file=true',
  import: 'default',
});

/**
 * このブログについて（/about）。はてなブログの about ページの文章を移したもの。
 * 親ページの @defer (hydrate never) の中でだけ使い、プリレンダー時にだけ実行される。
 */
@Component({
  selector: 'app-about-view',
  template: `
    <article class="bg-bg-card px-6 pt-14 pb-24 md:pt-20">
      <div class="mx-auto max-w-[692px]">
        <h1 class="text-[28px] leading-[1.25] font-bold md:text-[40px] md:leading-[1.2]">このブログについて</h1>

        <div class="article-body mt-10 md:mt-12" [innerHTML]="html()"></div>

        <dl class="mt-16 grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 border-t border-border/60 pt-8 text-[15px]">
          <dt class="font-bold">書いている人</dt>
          <dd><a href="https://x.com/neko3cs" class="text-accent underline underline-offset-2">neko3cs（X）</a></dd>
          <dt class="font-bold">ウェブサイト</dt>
          <dd>
            <a href="https://portfolio.neko3cs.net/" class="text-accent underline underline-offset-2">https://portfolio.neko3cs.net/</a>
          </dd>
          <dt class="font-bold">記事数</dt>
          <dd>{{ entryCount }} 記事</dd>
        </dl>
      </div>
    </article>
  `,
})
export class AboutView implements OnInit {
  private readonly applySeo = injectSeo();
  private readonly pendingTasks = inject(PendingTasks);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly html = signal<SafeHtml>('');
  protected readonly entryCount = entrySummaries.length;

  ngOnInit(): void {
    this.applySeo({ title: 'このブログについて', path: '/about' });

    // プリレンダーが読み込み完了を待つよう PendingTasks に登録する
    this.pendingTasks.run(async () => {
      const { body } = fm(await aboutFile['/content/about.md']());
      // 自分のリポジトリの Markdown からビルド時に生成した HTML なので、そのまま信頼して埋め込む
      this.html.set(this.sanitizer.bypassSecurityTrustHtml(body));
    });
  }
}
