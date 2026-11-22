import { defineConfig } from 'vite';
import analog from '@analogjs/platform';
import tailwindcss from '@tailwindcss/vite';

import { archivePaths, readEntries } from './src/server/entries.ts';

export default defineConfig(() => ({
  build: {
    target: ['es2020'],
  },
  resolve: {
    mainFields: ['module'],
  },
  plugins: [
    analog({
      // サーバーを出力せず、プリレンダーした静的ファイルだけを出力する
      static: true,
      content: {
        highlighter: 'shiki',
        shikiOptions: {
          highlighter: {
            themes: ['github-light'],
            // 記事のコードブロックで使っている言語（scripts/import-hatena.mjs の LANGUAGES と揃える）
            additionalLangs: [
              'shellscript', 'csharp', 'cpp', 'java', 'javascript', 'python', 'sql', 'json', 'powershell',
              'xml', 'cmake', 'qml', 'bicep', 'viml', 'latex', 'html', 'csv', 'yaml',
            ],
          },
          highlight: { theme: 'github-light' },
        },
      },
      prerender: {
        // 記事（はてなの元URLのパス）と、記事から作られる一覧ページをすべて列挙する。
        // contentDir での列挙は既定でサブフォルダを探さず、日付形式の記事（entry/2020/03/30/002449）が漏れるため使わない。
        routes: async () => {
          const entries = readEntries();
          return [
            '/',
            '/about',
            '/archive',
            ...archivePaths(entries),
            ...entries.map((entry) => entry.path),
            '/feed',
            '/rss',
            '/sitemap.xml',
            '/404',
          ];
        },
        postRenderingHooks: [
          async (route) => {
            // Nitro は「#」などをエンコードしたままのファイル名（C%23.html）で書き出すが、
            // Cloudflare は URL をデコードしてからファイルを探す（C#.html）。そのためデコードした名前で書き出す。
            route.fileName = route.fileName && decodeURIComponent(route.fileName);
          },
          async (route) => {
            // 404.html は存在しないすべてのURLで返されるため、ブラウザで Angular を起動するとハイドレーションが合わない。
            // 動きのないページなので、JS の読み込みを取り除いて静的な HTML として返す。
            if (route.route === '/404' && route.contents) {
              route.contents = route.contents
                .replace(/<script type="module"[^>]*><\/script>/g, '')
                .replace(/<link rel="modulepreload"[^>]*>/g, '');
            }
          },
        ],
      },
      nitro: {
        // はてなのURLは末尾スラッシュなし。entry/foo/index.html ではなく entry/foo.html で出力する
        prerender: { autoSubfolderIndex: false },
      },
    }),
    tailwindcss(),
  ],
}));
