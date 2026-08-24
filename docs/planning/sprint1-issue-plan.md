# Sprint 1 Issue分割計画

## 1. このドキュメントの目的

本書は、`sprint1-product-backlog.md`で合意したPBI-01〜PBI-10と、GitHub上に作成したSprint 1実装Issueの対応関係、依存関係および推奨着手順を記録する。

実装時は、本書をIssue一覧の原本として固定するのではなく、GitHub Issueを進捗管理の正本として扱う。PBIや設計との追跡関係、Issue分割方針を変更した場合は本書も更新する。

---

## 2. Issue分割方針

- 画面、API、DBの層だけでは分けず、ユーザーが確認できる業務結果ごとに縦割りする
- PBI-01〜PBI-10とFEAT-01〜FEAT-10を1対1で対応させる
- 登録、編集、削除は、受け入れ結果と重要な業務ルールが異なるため別Issueとする
- モバイル対応、入力・エラー状態、アクセシビリティおよび必要なテストを各機能Issueへ含める
- 親IssueのEstimateは空欄とし、子Issueの合計だけを見積もりとして扱う
- 製品動作へ影響しない実装判断は対象Issueに理由と代替案を記録する
- 製品動作へ影響する未決事項が新たに見つかった場合は、実装で確定せずPMへ確認する

---

## 3. Sprint 1親Issue

|項目|内容|
|---|---|
|Issue|[#32 `[SPRINT-1] 基本機能を実装する`](https://github.com/agent-job-tracker-lab/agent-job-tracker/issues/32)|
|役割|Sprint 1全体の目的、受け入れ条件、Sub-issue進捗を管理する|
|Status|Sprint Backlog|
|Sprint|Sprint 1|
|Priority|P0|
|Work type|Feature|
|Estimate|未設定。子Issueとの二重計上を避ける|

---

## 4. PBIと実装Issueの対応

|順序|PBI|実装Issue|主な業務結果|Estimate|Project設定|
|---:|---|---|---|---:|---|
|1|PBI-01|[#33 FEAT-01 ログイン・ログアウトとアクセス保護](https://github.com/agent-job-tracker-lab/agent-job-tracker/issues/33)|本人だけがアクセスし、安全に利用を終了できる|5|Sprint Backlog / Sprint 1 / P0 / Feature|
|2|PBI-02|[#34 FEAT-02 エージェント会社の一覧・詳細](https://github.com/agent-job-tracker-lab/agent-job-tracker/issues/34)|会社、担当者、関連案件を把握できる|5|Sprint Backlog / Sprint 1 / P0 / Feature|
|3|PBI-03|[#35 FEAT-03 エージェント会社の登録](https://github.com/agent-job-tracker-lab/agent-job-tracker/issues/35)|新しい案件紹介元を追加できる|3|Sprint Backlog / Sprint 1 / P0 / Feature|
|4|PBI-04|[#36 FEAT-04 エージェント会社の編集](https://github.com/agent-job-tracker-lab/agent-job-tracker/issues/36)|会社・担当者情報を最新化できる|3|Sprint Backlog / Sprint 1 / P0 / Feature|
|5|PBI-05|[#37 FEAT-05 案件の一覧・詳細](https://github.com/agent-job-tracker-lab/agent-job-tracker/issues/37)|案件条件と現在の応募状態を把握できる|8|Sprint Backlog / Sprint 1 / P0 / Feature|
|6|PBI-06|[#38 FEAT-06 案件と初期Applicationの登録](https://github.com/agent-job-tracker-lab/agent-job-tracker/issues/38)|案件と応募管理の初期状態を欠損なく追加できる|8|Sprint Backlog / Sprint 1 / P0 / Feature|
|7|PBI-07|[#39 FEAT-07 案件の編集](https://github.com/agent-job-tracker-lab/agent-job-tracker/issues/39)|案件情報を最新化できる|5|Sprint Backlog / Sprint 1 / P0 / Feature|
|8|PBI-08|[#40 FEAT-08 応募ステータス更新と履歴記録](https://github.com/agent-job-tracker-lab/agent-job-tracker/issues/40)|現在の選考状況と変更経緯を記録できる|8|Sprint Backlog / Sprint 1 / P0 / Feature|
|9|PBI-09|[#41 FEAT-09 案件の論理削除](https://github.com/agent-job-tracker-lab/agent-job-tracker/issues/41)|不要な案件を除外しつつ応募履歴を保持できる|3|Sprint Backlog / Sprint 1 / P0 / Feature|
|10|PBI-10|[#42 FEAT-10 エージェント会社の論理削除](https://github.com/agent-job-tracker-lab/agent-job-tracker/issues/42)|案件との整合性を保って不要な会社を除外できる|3|Sprint Backlog / Sprint 1 / P0 / Feature|

子Issueの概算合計は`51 Story Point`である。チームのベロシティは未確定であるため、この合計がSprint 1へ収まることを意味しない。Sprint 1開始前に稼働期間・要員と照合し、必要であればIssueをさらに分割する。ただし、今回の必須提出範囲をSprint 2へ移す製品判断は本書では行わない。

---

## 5. 依存関係

|Issue|先行Issue|理由|
|---|---|---|
|#33 FEAT-01|#27 TECH-02|認証・DB・ローカル環境の基盤を利用する|
|#34 FEAT-02|#33 FEAT-01|保護対象画面とAPIとして実装する|
|#35 FEAT-03|#33、#34|認証済み共通画面と会社表示基盤を利用する|
|#36 FEAT-04|#34、#35|詳細・登録フォームの取得・表示・検証を再利用する|
|#37 FEAT-05|#33、#34|認証と紹介元会社の表示・導線を利用する|
|#38 FEAT-06|#34、#37|会社選択肢と案件詳細・一覧の表示基盤を利用する|
|#39 FEAT-07|#37、#38|案件取得と登録フォーム・検証を再利用する|
|#40 FEAT-08|#37、#38|表示対象のJob/Applicationと一覧・詳細UIを利用する|
|#41 FEAT-09|#37、#38|対象JobとApplicationが存在する状態で保持ルールを検証する|
|#42 FEAT-10|#34、#37、#41|会社・関連Job表示と論理削除済みJobを含む制約を検証する|

依存は着手の絶対禁止ではない。共通契約を先に固定できる場合は並行作業できるが、依存先が未完成の状態でモックや暫定仕様を導入する場合は、置換条件をIssueへ明記する。

### 5.1 推奨着手順

1. #33 FEAT-01
2. #34 FEAT-02
3. #35 FEAT-03
4. #36 FEAT-04
5. #37 FEAT-05
6. #38 FEAT-06
7. #39 FEAT-07
8. #40 FEAT-08
9. #41 FEAT-09
10. #42 FEAT-10

一人で順番に実装する場合の推奨順である。複数人で作業する場合は、#35と#37、#36と#38などを、共有部品やAPI契約の競合を避けたうえで並行化できる。

---

## 6. 各Issueに含めた共通情報

各FEAT Issueには以下を記載した。

- 背景・目的
- 対応内容
- 対象外
- テスト可能な受け入れ条件
- unit、integration、E2Eを含むリスク別テスト観点
- 依存Issue
- PBI、ユースケース、画面・UI、API、エンティティのトレーサビリティ
- 関連設計資料
- Sprint 1親Issue

Projectでは全FEAT Issueを次の状態で作成した。

- Status：Sprint Backlog
- Sprint：Sprint 1
- Priority：P0
- Work type：Feature
- Estimate：PBIの相対見積もり
- Assignee：Developer（`ricky-oden`）

着手時に対象Issueだけを`In Progress`へ変更し、同時進行数を増やしすぎない。

---

## 7. 実装Issueで確定した技術判断

### 7.1 Application現在ステータスの取得

#37 FEAT-05では、Job一覧・詳細の表示に必要な現在ステータスをJOB-01、JOB-02相当のレスポンスへ含め、表示のためだけのAPP-01独立リクエストを行わない方針とした。

理由は以下のとおりである。

- JobとApplicationはSprint 1で1対1である
- 一覧で案件ごとの現在ステータスが必ず必要である
- 独立リクエストでは追加通信またはN+1リクエストを招きやすい
- Job情報とステータスの表示時点を合わせやすい

代表的な代替案は、APP-01を独立APIとして画面から呼び出す方法である。Applicationを独立して再取得・再利用する要件が増えた場合は有効だが、Sprint 1の表示要件では複雑さが上回る。APP-02相当のステータス更新責務は独立したままとする。

これは画面に表示する製品情報を変えず、API呼び出しの構成だけを決める技術判断である。

---

## 8. Sprint 0親Issueへの反映

Sprint 0親Issue #2では、PLAN-02の実施結果に合わせて以下を完了へ更新した。

- ローカル開発環境を構築する
- プロダクトバックログを見直す
- Sprint 1の作業をIssueへ分解する
- Sprint 1の実装範囲、設計、技術選定、Issue作成、未決事項整理に関する受け入れ条件

以下は未完了のまま残す。

- 別の開発者がREADMEの手順でローカル環境を起動できる

TECH-02で環境構築と自動検証は完了しているが、別環境・別作業者による再現確認は実施していない。Sprint 0親IssueをClosedにする前に、READMEだけを使用した手動セットアップ確認が必要である。

---

## 9. Sprint 1開始時の運用

1. Sprint 0親Issue #2の残る手動確認を完了し、Sprint 0をClosed / Doneにする
2. Sprint 1親Issue #32を`In Progress`へ変更する
3. #33 FEAT-01を`In Progress`へ変更する
4. #33専用の作業ブランチをmainから作成する
5. 実装、検証、コミット、push、PR、PMレビュー、マージを行う
6. #33をDoneにし、次に依存関係を満たしたIssueへ着手する

各Issueで既存設計と異なる製品判断が必要になった場合は、そのIssue内で「既存資料から確定できる内容」と「追加で判断が必要な内容」を分け、PM判断後に実装する。
