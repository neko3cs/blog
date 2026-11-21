import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

export const SITE_TITLE = 'ねこさんのぶろぐ';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <nav class="sticky top-0 z-50 border-b border-black/5 bg-white/70 backdrop-blur-xl backdrop-saturate-150">
      <div class="mx-auto flex h-13 max-w-300 items-center justify-between px-6">
        <a href="/" class="text-[19px] font-bold md:text-[21px]">{{ siteTitle }}</a>
        <div class="flex items-center gap-6 text-xs text-text-main/80">
          <a href="https://portfolio.neko3cs.net" class="transition-colors hover:text-text-main">Portfolio</a>
          <a href="https://zenn.dev/neko3cs" class="transition-colors hover:text-text-main">Zenn</a>
        </div>
      </div>
    </nav>

    <router-outlet />

    <footer class="border-t border-border/60">
      <div class="mx-auto max-w-300 px-6 py-10 text-xs text-text-sub">
        Copyright © {{ year }} neko3cs. All rights reserved.
      </div>
    </footer>
  `,
})
export class App {
  readonly siteTitle = SITE_TITLE;
  readonly year = new Date().getFullYear();
}
