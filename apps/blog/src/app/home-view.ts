import { Component, OnInit } from '@angular/core';

import { EntryList } from './entry-list';
import { entrySummaries } from './entry-index';
import { injectSeo } from './seo';
import { SITE_TITLE } from '../lib/site';
import { websiteJsonLd } from '../lib/structured-data';

const LATEST_COUNT = 10;

/**
 * トップページ。最新の記事をカードで並べる。
 * 一覧はポートフォリオと同じく灰色の背景に白いカード、記事ページは白い背景という使い分けにしている。
 */
@Component({
  selector: 'app-home-view',
  imports: [EntryList],
  template: `
    <section class="apple-section !pt-16 !pb-24 md:!pt-24">
      <header class="mb-12 md:mb-16">
        <h1 class="apple-heading-m">{{ siteTitle }}</h1>
        <p class="mt-4 text-[17px] text-text-sub">neko3cs の技術ブログです。</p>
      </header>

      <h2 class="mb-6 text-[21px] font-bold">最新の記事</h2>
      <app-entry-list [entries]="latest" layout="cards" />

      @if (total > latest.length) {
        <p class="mt-10 text-center">
          <a href="/archive" class="apple-link">すべての記事を見る（{{ total }} 件）</a>
        </p>
      }
    </section>
  `,
})
export class HomeView implements OnInit {
  private readonly applySeo = injectSeo();

  protected readonly siteTitle = SITE_TITLE;
  protected readonly latest = entrySummaries.slice(0, LATEST_COUNT);
  protected readonly total = entrySummaries.length;

  ngOnInit(): void {
    this.applySeo({ path: '/', jsonLd: [websiteJsonLd()] });
  }
}
