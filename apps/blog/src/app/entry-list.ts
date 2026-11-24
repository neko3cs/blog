import { Component, input } from '@angular/core';

import { EntrySummary } from './entry-index';
import { formatDate } from '../lib/site';

/** 記事の一覧。トップはカード、アーカイブは行で表示する */
@Component({
  selector: 'app-entry-list',
  template: `
    @if (layout() === 'cards') {
      <ul class="grid grid-cols-1 gap-5 md:grid-cols-2">
        @for (entry of entries(); track entry.path) {
          <li>
            <a [href]="entry.path" class="apple-card flex h-full flex-col p-7 md:p-8">
              <p class="apple-eyebrow">{{ entry.categories.join(' · ') }}</p>
              <h3 class="mt-3 text-[21px] leading-snug font-bold">{{ entry.title }}</h3>
              <time [attr.datetime]="entry.date.toISOString()" class="mt-auto pt-5 text-sm font-semibold text-text-sub">
                {{ formatDate(entry.date) }}
              </time>
            </a>
          </li>
        }
      </ul>
    } @else {
      <ul class="divide-y divide-border/60 border-y border-border/60">
        @for (entry of entries(); track entry.path) {
          <li>
            <a [href]="entry.path" class="group flex flex-col gap-1 py-4 md:flex-row md:items-baseline md:gap-6">
              <time [attr.datetime]="entry.date.toISOString()" class="shrink-0 text-sm text-text-sub md:w-36">
                {{ formatDate(entry.date) }}
              </time>
              <span class="font-medium group-hover:text-accent group-hover:underline">{{ entry.title }}</span>
            </a>
          </li>
        }
      </ul>
    }
  `,
})
export class EntryList {
  readonly entries = input.required<EntrySummary[]>();
  readonly layout = input<'cards' | 'rows'>('rows');

  protected readonly formatDate = formatDate;
}
