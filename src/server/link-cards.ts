// 記事の Markdown を HTML にするとき（ビルド時）に、リンクカードと X の投稿のカードを作る marked の拡張（Issue #6）。
// vite.config.ts と scripts/fetch-link-cards.mjs から読み込まれる。ブラウザ向けのコードからは import しないこと。
//
// 書き方:
//   リンクカード: 段落にリンクを1つだけ置く（[タイトル](URL)）。リンク先の情報は content/link-cards.json から読む。
//                 情報がないリンクは普通のリンクのまま表示する。`pnpm fetch:link-cards` で情報を取得する。
//   X の投稿:     引用の最後の段落を「— 名前 (@ID) [日付](投稿のURL)」にする（X の「埋め込む」でコピーした形と同じ）。

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { MarkedExtension, Token, Tokens } from 'marked';

// vite.config.ts から読み込まれるため、拡張子を付ける（Vite の設定ファイルの読み込みで必要）
import { toDescriptionFromMarkdown } from '../lib/description.ts';
import { SITE_URL } from '../lib/site.ts';
import { readEntries } from './entries.ts';

export interface LinkCard {
  title: string;
  description: string;
  /** サイト内に保存したサムネイル（/images/link-cards/….jpg） */
  image?: string;
  /** github.com など、カードの下に出すサイトのドメイン */
  domain: string;
}

export const LINK_CARDS_FILE = join(process.cwd(), 'content/link-cards.json');

const TWEET_URL = /^https:\/\/(?:twitter|x)\.com\/\w+\/status\/\d+/;

/** 段落がリンク1つだけでできていれば、そのリンクを返す（画像のリンクは除く） */
export function standaloneLink(paragraph: Tokens.Paragraph): Tokens.Link | undefined {
  const tokens = paragraph.tokens.filter((token) => !(token.type === 'text' && !token.raw.trim()));
  const [link] = tokens;
  if (tokens.length !== 1 || link.type !== 'link') {
    return undefined;
  }
  return (link as Tokens.Link).tokens.some((token) => token.type === 'image') ? undefined : (link as Tokens.Link);
}

/** サイト内の記事へのリンクなら、記事のパス（/entry/…）を返す */
export function internalPath(href: string): string | undefined {
  const path = href.startsWith(SITE_URL) ? href.slice(SITE_URL.length) : href;
  return path.startsWith('/entry/') ? path : undefined;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

function plainText(tokens: Token[]): string {
  return tokens.map((token) => ('tokens' in token && token.tokens ? plainText(token.tokens) : token.type === 'escape' ? token.text : token.raw)).join('');
}

function cardHtml(href: string, title: string, card: Omit<LinkCard, 'title'>): string {
  const image = card.image
    ? `<img class="link-card-image" src="${escapeHtml(card.image)}" alt="" width="200" height="200" loading="lazy">`
    : '';
  // はてなのリンクカードと同じく、外部のサイトは新しいタブで開く（サイト内の記事は同じタブで開く）
  const target = href.startsWith('/') ? '' : ' target="_blank" rel="noopener"';
  return (
    `<a class="link-card" href="${escapeHtml(href)}"${target}>` +
    '<span class="link-card-body">' +
    `<span class="link-card-title">${escapeHtml(title)}</span>` +
    // タイトルをそのまま説明にしているページもあるため、同じなら出さない
    (card.description && card.description !== title ? `<span class="link-card-description">${escapeHtml(card.description)}</span>` : '') +
    `<span class="link-card-domain">${escapeHtml(card.domain)}</span>` +
    '</span>' +
    image +
    '</a>\n'
  );
}

export function linkCardsExtension(): MarkedExtension {
  const cards: Record<string, LinkCard> = existsSync(LINK_CARDS_FILE) ? JSON.parse(readFileSync(LINK_CARDS_FILE, 'utf8')) : {};
  const entries = new Map(readEntries().map((entry) => [entry.path, entry]));

  return {
    renderer: {
      paragraph(token) {
        const link = standaloneLink(token);
        if (!link) {
          return false;
        }
        const title = plainText(link.tokens);
        const path = internalPath(link.href);
        const entry = path && entries.get(path);
        if (entry) {
          return cardHtml(path, title, { description: toDescriptionFromMarkdown(entry.body), domain: new URL(SITE_URL).host });
        }
        const card = cards[link.href];
        return card ? cardHtml(link.href, title, card) : false;
      },

      blockquote(token) {
        const attribution = token.tokens.at(-1);
        const link = attribution?.type === 'paragraph' ? attribution.tokens?.at(-1) : undefined;
        if (attribution?.type !== 'paragraph' || link?.type !== 'link' || !TWEET_URL.test(link.href) || !attribution.text.startsWith('—')) {
          return false;
        }
        // 埋め込みのコードに付く計測用のパラメーター（?ref_src=twsrc%5Etfw）は外す
        const tweetLink = { ...link, href: link.href.replace(/\?.*$/, '') };
        // 投稿の中のリンク（t.co・ハッシュタグ）と日付のリンクは、リンクカードと同じく新しいタブで開く。
        // 日付のリンク（tweet-card-link）は CSS でカード全体に広げ、カードのどこをクリックしても投稿を開けるようにする
        const newTab = (html: string) => html.replace(/<a href=/g, '<a target="_blank" rel="noopener" href=');
        const body = newTab(this.parser.parse(token.tokens.slice(0, -1)));
        const footer = newTab(this.parser.parseInline([...(attribution.tokens ?? []).slice(0, -1), tweetLink])).replace(
          /<a target="_blank" rel="noopener" href="([^"]*)">(?![\s\S]*<a )/,
          '<a class="tweet-card-link" target="_blank" rel="noopener" href="$1">',
        );
        return (
          '<figure class="tweet-card">' +
          '<p class="tweet-card-label">X（Twitter）の投稿</p>' +
          `<blockquote>${body}</blockquote>` +
          `<figcaption>${footer}</figcaption>` +
          '</figure>\n'
        );
      },
    },
  };
}
