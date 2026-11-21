// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://blog.neko3cs.net',
  // はてなブログのURLは末尾スラッシュなし。entry/foo.html 形式で出力し、
  // Cloudflare が /entry/foo へのリクエストに .html を補って返すことでURLを維持する。
  trailingSlash: 'never',
  build: { format: 'file' },
  markdown: {
    shikiConfig: { theme: 'github-light' },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
