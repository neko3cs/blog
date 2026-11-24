---
Title: PythonでExcelの表をMarkdown形式の文字列に変換する
Category:
- Python
- Pandas
- 備忘録
Date: 2024-10-02T16:38:28+09:00
URL: https://blog.neko3cs.net/entry/excel-to-md-using-python
---

備忘録です。

以下のように簡単にMarkdownに起こすことが出来ます。

テキストファイルに出力してもいいですね。

```python
import pandas as pd
df = pd.read_excel('Excelファイル.xlsx', sheet_name='Sheet1', usecols='A:D', nrows=16)
markdown_table = df.to_markdown(index=False)
print(markdown_table)
```

使うためには `pandas` と `tabulate` というパッケージをインストールする必要があります。

```shellscript
pip install pandas
pip install tabulate
```
