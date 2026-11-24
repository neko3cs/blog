import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SITE_TITLE } from '../lib/site';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <nav class="sticky top-0 z-50 border-b border-black/5 bg-white/70 backdrop-blur-xl backdrop-saturate-150">
      <div class="mx-auto flex h-13 max-w-300 items-center justify-between gap-4 px-6">
        <a href="/" class="shrink-0 text-[19px] font-bold md:text-[21px]">{{ siteTitle }}</a>
        <div class="flex items-center gap-4 text-xs text-text-main/80 md:gap-6">
          <a href="/archive" class="transition-colors hover:text-text-main">記事一覧</a>
          <a href="/about" class="transition-colors hover:text-text-main">About</a>
          <a href="https://portfolio.neko3cs.net" class="hidden transition-colors hover:text-text-main sm:inline">Portfolio</a>
          <a href="https://zenn.dev/neko3cs" class="hidden transition-colors hover:text-text-main sm:inline">Zenn</a>
        </div>
      </div>
    </nav>

    <router-outlet />

    <footer class="border-t border-border/60">
      <div class="mx-auto flex max-w-300 flex-col gap-4 px-6 py-10 text-xs text-text-sub md:flex-row md:justify-between">
        <ul class="flex flex-wrap gap-x-6 gap-y-2">
          <li><a href="/archive" class="hover:underline">記事一覧</a></li>
          <li><a href="/about" class="hover:underline">このブログについて</a></li>
          <li><a href="/feed" class="hover:underline">フィード</a></li>
          <li><a href="https://portfolio.neko3cs.net" class="hover:underline">Portfolio</a></li>
          <li><a href="https://zenn.dev/neko3cs" class="hover:underline">Zenn</a></li>
        </ul>
        <p>Copyright © {{ year }} neko3cs. All rights reserved.</p>
      </div>
    </footer>
  `,
})
export class App {
  readonly siteTitle = SITE_TITLE;
  readonly year = new Date().getFullYear();
}
