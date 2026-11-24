---
Title: Azure DevOps で PR をマージするときにブランチを削除出来なくなった際の対処法
Category:
- 備忘録
- Azure DevOps
Date: 2020-07-18T20:04:33+09:00
URL: https://blog.neko3cs.net/entry/azure-devops-cannot-delete-branch-on-merge-pr
---

気づいたら PR をマージするときにグレーアウトしててソースブランチを削除できなくなってしまいました。

このままではゴミブランチが溜まってしまうのでその対処法を備忘録します。

といっても単純で、リポジトリの設定で Force push の設定を Allow にしておくだけです。

![f:id:neko3cs:20200718200011p:plain](/images/20200718/20200718200011.png)

細かいことは以下のページをご確認ください。

[Set Git branch security and permissions - Azure Repos](https://docs.microsoft.com/en-us/azure/devops/repos/git/branch-permissions?view=azure-devops#permissions-in-azure-devops-services)

設定をするとチェックを入れられるようになります。

![f:id:neko3cs:20200718194722p:plain](/images/20200718/20200718194722.png)
