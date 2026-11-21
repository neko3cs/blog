import { defineConfig } from 'vite';
import analog from '@analogjs/platform';
import tailwindcss from '@tailwindcss/vite';

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
          highlighter: { themes: ['github-light'], additionalLangs: ['sql'] },
          highlight: { theme: 'github-light' },
        },
      },
      prerender: {
        routes: [
          {
            contentDir: '/content/entry',
            // blogsync の frontmatter にある はてなの元URL を、そのままプリレンダー対象にする
            transform: (file) => new URL(file.attributes['URL']).pathname,
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
