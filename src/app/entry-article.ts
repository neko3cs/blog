import { Component, computed, inject, input, OnInit, PendingTasks, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { Entry, loadEntry } from './entries';
import { injectSeo } from './seo';
import { toDescriptionFromHtml } from '../lib/description';
import { categoryPath, formatDate } from '../lib/site';

/**
 * 記事本文。親ページの @defer (hydrate never) の中でだけ使い、
 * プリレンダー時にだけ実行される（ブラウザには読み込まれない）。
 */
@Component({
  selector: 'app-entry-article',
  template: `
    @if (entry(); as entry) {
      <!-- 記事は白い背景に直接置き、見出しまわりは本文と同じ幅で左揃えにする -->
      <article class="bg-bg-card px-6 pt-14 pb-24 md:pt-20">
        <div class="mx-auto max-w-[692px]">
          <header>
            <p class="apple-eyebrow">{{ categories().join(' · ') }}</p>
            <time [attr.datetime]="publishedAt()?.toISOString()" class="mt-1 block text-sm font-semibold text-text-sub">
              {{ dateLabel() }}
            </time>
            <h1 class="mt-4 text-[28px] leading-[1.25] font-bold text-pretty md:text-[40px] md:leading-[1.2]">
              {{ entry.attributes.Title }}
            </h1>
          </header>

          <div class="article-body mt-10 md:mt-12" [innerHTML]="html()"></div>

          @if (categories().length > 0) {
            <div class="mt-16 flex flex-wrap gap-2 border-t border-border/60 pt-8">
              @for (name of categories(); track name) {
                <a [href]="categoryPath(name)" class="apple-pill">{{ name }}</a>
              }
            </div>
          }
        </div>
      </article>
    }
  `,
})
export class EntryArticle implements OnInit {
  /** "2020/03/30/002449" のような URL パス */
  readonly path = input.required<string>();

  private readonly applySeo = injectSeo();
  private readonly pendingTasks = inject(PendingTasks);
  private readonly sanitizer = inject(DomSanitizer);

  readonly entry = signal<Entry | undefined>(undefined);
  readonly html = signal<SafeHtml>('');
  readonly categories = computed(() => this.entry()?.attributes.Category ?? []);
  readonly publishedAt = computed(() => {
    const date = this.entry()?.attributes.Date;
    return date ? new Date(date) : undefined;
  });
  readonly dateLabel = computed(() => {
    const date = this.publishedAt();
    return date ? formatDate(date) : '';
  });

  protected readonly categoryPath = categoryPath;

  ngOnInit(): void {
    // プリレンダーが記事の読み込み完了を待つよう PendingTasks に登録する
    this.pendingTasks.run(async () => {
      const entry = await loadEntry(this.path());
      if (!entry) {
        return;
      }
      // 自分のリポジトリの Markdown からビルド時に生成した HTML なので、そのまま信頼して埋め込む
      this.html.set(this.sanitizer.bypassSecurityTrustHtml(entry.html));
      this.applySeo({
        title: entry.attributes.Title,
        path: `/entry/${this.path()}`,
        description: toDescriptionFromHtml(entry.html),
        type: 'article',
        publishedTime: new Date(entry.attributes.Date),
      });
      this.entry.set(entry);
    });
  }
}
