/** blogsync が出力する frontmatter（はてなブログの記事情報） */
export interface EntryAttributes {
  Title: string;
  Category?: string[];
  Date: string | Date;
  URL: string;
  EditURL?: string;
  Draft?: boolean;
}
