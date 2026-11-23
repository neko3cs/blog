// Sveltia CMS の設定（config.yml）で使う、記事用の文字列の変換。
//
// entry_slug: 記事の URL から、スラッグ（ファイル名）を取り出す。
//   https://blog.neko3cs.net/entry/foo-bar → foo-bar
// 記事のファイルのパスが、そのまま記事の URL のパスになるため、URL からファイル名を決める。
CMS.registerStringTransformation('entry_slug', (value) =>
  String(value ?? '').replace(/^https:\/\/blog\.neko3cs\.net\/entry\//, ''),
);
