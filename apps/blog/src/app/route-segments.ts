import { inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/**
 * 現在のURLのパスを、ルートからの断片の配列で返す（/archive/2024/08 → ['archive', '2024', '08']）。
 * Analog は動的ルートや catch-all を親子のルートに分けて登録するため、
 * ページ自身の ActivatedRoute だけではパスの一部しか取れない。そのためルートから連結する。
 * 断片はデコード済み（%2F を含むカテゴリ名は「/」を含む1つの断片になる）。
 */
export function injectRouteSegments(): string[] {
  return inject(ActivatedRoute).pathFromRoot.flatMap((route) => route.snapshot.url.map((segment) => segment.path));
}
