import { Component, computed, input, OnInit } from '@angular/core';

import { EntryList } from './entry-list';
import { entrySummaries } from './entry-index';
import { injectSeo } from './seo';
import { categoryPath } from '../lib/site';

export type ArchiveFilter =
  | { kind: 'all' }
  | { kind: 'year'; year: string }
  | { kind: 'month'; year: string; month: string }
  | { kind: 'day'; year: string; month: string; day: string }
  | { kind: 'category'; name: string };

/**
 * 記事一覧（/archive、年別、月別、カテゴリ別）。
 * 親ページの @defer (hydrate never) の中でだけ使い、プリレンダー時にだけ実行される。
 */
@Component({
  selector: 'app-archive-view',
  imports: [EntryList],
  template: `
    <section class="bg-bg-card px-6 pt-14 pb-24 md:pt-20">
      <div class="mx-auto max-w-[860px]">
        <header>
          <p class="apple-eyebrow">{{ eyebrow() }}</p>
          <h1 class="mt-2 text-[28px] leading-[1.25] font-bold md:text-[40px] md:leading-[1.2]">{{ heading() }}</h1>
          <p class="mt-3 text-sm text-text-sub">{{ entries().length }} 件の記事</p>
        </header>

        <div class="mt-10">
          <app-entry-list [entries]="entries()" />
        </div>

        <nav class="mt-16 grid gap-10 md:grid-cols-2" aria-label="アーカイブ">
          <div>
            <h2 class="text-[17px] font-bold">年別</h2>
            <ul class="mt-4 flex flex-wrap gap-2">
              @for (year of years(); track year.value) {
                <li><a [href]="'/archive/' + year.value" class="apple-pill">{{ year.value }}（{{ year.count }}）</a></li>
              }
            </ul>
          </div>
          <div>
            <h2 class="text-[17px] font-bold">カテゴリー</h2>
            <ul class="mt-4 flex flex-wrap gap-2">
              @for (category of categories(); track category.value) {
                <li>
                  <a [href]="categoryPath(category.value)" class="apple-pill">{{ category.value }}（{{ category.count }}）</a>
                </li>
              }
            </ul>
          </div>
        </nav>
      </div>
    </section>
  `,
})
export class ArchiveView implements OnInit {
  readonly filter = input.required<ArchiveFilter>();
  /** canonical に使うパス（/archive/2024 など） */
  readonly path = input.required<string>();

  private readonly applySeo = injectSeo();

  readonly entries = computed(() => {
    const filter = this.filter();
    switch (filter.kind) {
      case 'all':
        return entrySummaries;
      case 'year':
        return entrySummaries.filter((entry) => entry.year === filter.year);
      case 'month':
        return entrySummaries.filter((entry) => entry.year === filter.year && entry.month === filter.month);
      case 'day':
        return entrySummaries.filter(
          (entry) => entry.year === filter.year && entry.month === filter.month && entry.day === filter.day,
        );
      case 'category':
        return entrySummaries.filter((entry) => entry.categories.includes(filter.name));
    }
  });

  readonly eyebrow = computed(() => (this.filter().kind === 'category' ? 'カテゴリー' : 'アーカイブ'));

  readonly heading = computed(() => {
    const filter = this.filter();
    switch (filter.kind) {
      case 'all':
        return '記事一覧';
      case 'year':
        return `${filter.year}年の記事`;
      case 'month':
        return `${filter.year}年${Number(filter.month)}月の記事`;
      case 'day':
        return `${filter.year}年${Number(filter.month)}月${Number(filter.day)}日の記事`;
      case 'category':
        return filter.name;
    }
  });

  readonly years = computed(() => countBy(entrySummaries.map((entry) => entry.year)).sort((a, b) => b.value.localeCompare(a.value)));
  readonly categories = computed(() =>
    countBy(entrySummaries.flatMap((entry) => entry.categories)).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value)),
  );

  protected readonly categoryPath = categoryPath;

  ngOnInit(): void {
    const filter = this.filter();
    // はてなブログのページタイトルに合わせる（カテゴリは「C# カテゴリーの記事一覧」）
    const title =
      filter.kind === 'all' ? '記事一覧' : filter.kind === 'category' ? `${filter.name} カテゴリーの記事一覧` : `${this.heading()}一覧`;
    this.applySeo({ title, path: this.path() });
  }
}

function countBy(values: string[]): { value: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts].map(([value, count]) => ({ value, count }));
}
