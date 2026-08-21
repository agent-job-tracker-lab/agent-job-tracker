# Sprint 1 ワイヤーフレーム

## 1. 目的

本資料は、Sprint 1で実装する主要画面について、表示する情報、操作要素、情報の優先順位、画面状態を低忠実度ワイヤーフレームとして整理するものである。

実装前に要求定義、ユーザーフロー、画面一覧および画面遷移との整合性を確認し、後続のAPI設計、実装Issue、入力チェックおよびE2Eテスト設計へ引き継げる状態にすることを目的とする。

本資料と書き出し画像はGitHubレビュー用の成果物であり、編集可能な原本はFigmaとする。

## 2. 対象範囲

### 2.1 対象

- Sprint 1のSCR-01〜SCR-09
- スマートフォン対応対象のSCR-01、SCR-02、SCR-03、SCR-06、SCR-07
- UI-01〜UI-05
- ローディング、空状態、入力エラー、通信エラー、保存中、保存成功、保存失敗などの代表的な画面状態
- ログイン、案件管理、エージェント会社管理、応募ステータス更新、削除確認、ログアウトの主要フロー

### 2.2 対象外

- 色、フォント、アイコンなどの最終的なビジュアルデザイン
- 高忠実度のUIデザインおよび本格的なデザインシステム
- URL、ルーティングパス、API、DB、実装コンポーネントの詳細設計
- 入力項目の最大長および詳細なバリデーションルール
- Sprint 2以降の画面

## 3. Figma原本

- [Agent Job Tracker / Sprint 1 Wireframes](https://www.figma.com/design/VYrHvwydQe09fAtez75TyA/Agent-Job-Tracker---Sprint-1-Wireframes)

Figmaファイルは編集可能な原本として扱う。リポジトリ内のPNGは、Pull Request上で内容を確認するためにFigmaの最新版から書き出したものである。

## 4. Figmaのページ構成

Issueでは、Cover、Desktop、Mobile、States、Componentsの5つを論理区分として定義した。

Figma無料プランのページ数制約に対応するため、PM承認のもと、実ファイルでは次の3ページに統合している。成果物の対象範囲は変更せず、各区分はページ内のフレーム名によって識別する。

|実際のFigmaページ|含まれる論理区分|内容|
|---|---|---|
|Cover + Components|Cover、Components|目的、対象範囲、関連資料、共通要素|
|Desktop|Desktop|SCR-01〜SCR-09のデスクトップ向け画面|
|Mobile + States|Mobile、States|スマートフォン対応5画面、代表的な画面状態、UI-01〜UI-05|

## 5. 画面とFigmaフレームの対応

### 5.1 デスクトップ

|画面ID|画面名|Figmaフレーム|書き出し画像|
|---|---|---|---|
|SCR-01|ログイン画面|SCR-01 / Login / Desktop / Content|[PNG](wireframes/desktop/scr-01-login.png)|
|SCR-02|案件一覧画面|SCR-02 / Job List / Desktop / Content|[PNG](wireframes/desktop/scr-02-job-list.png)|
|SCR-03|案件詳細画面|SCR-03 / Job Detail / Desktop / Content|[PNG](wireframes/desktop/scr-03-job-detail.png)|
|SCR-04|案件登録画面|SCR-04 / Job Create / Desktop|[PNG](wireframes/desktop/scr-04-job-create.png)|
|SCR-05|案件編集画面|SCR-05 / Job Edit / Desktop|[PNG](wireframes/desktop/scr-05-job-edit.png)|
|SCR-06|エージェント会社一覧画面|SCR-06 / Agent Company List / Desktop|[PNG](wireframes/desktop/scr-06-agent-company-list.png)|
|SCR-07|エージェント会社詳細画面|SCR-07 / Agent Company Detail / Desktop|[PNG](wireframes/desktop/scr-07-agent-company-detail.png)|
|SCR-08|エージェント会社登録画面|SCR-08 / Agent Company Create / Desktop|[PNG](wireframes/desktop/scr-08-agent-company-create.png)|
|SCR-09|エージェント会社編集画面|SCR-09 / Agent Company Edit / Desktop|[PNG](wireframes/desktop/scr-09-agent-company-edit.png)|

### 5.2 スマートフォン

|画面ID|画面名|Figmaフレーム|利用範囲|書き出し画像|
|---|---|---|---|---|
|SCR-01|ログイン画面|SCR-01 / Login / Mobile|ログイン|[PNG](wireframes/mobile/scr-01-login.png)|
|SCR-02|案件一覧画面|SCR-02 / Job List / Mobile|閲覧、応募ステータス更新、ログアウト|[PNG](wireframes/mobile/scr-02-job-list.png)|
|SCR-03|案件詳細画面|SCR-03 / Job Detail / Mobile|閲覧、応募ステータス更新、ログアウト|[PNG](wireframes/mobile/scr-03-job-detail.png)|
|SCR-06|エージェント会社一覧画面|SCR-06 / Agent Company List / Mobile|閲覧、ログアウト|[PNG](wireframes/mobile/scr-06-agent-company-list.png)|
|SCR-07|エージェント会社詳細画面|SCR-07 / Agent Company Detail / Mobile|閲覧、ログアウト|[PNG](wireframes/mobile/scr-07-agent-company-detail.png)|

スマートフォンでは、案件およびエージェント会社の登録、編集、削除を利用不可とする。利用不可の操作は、デスクトップで利用できることが分かる案内として表現している。

## 6. 画面内UIの対応

|UI ID|名称|主な配置|ワイヤーフレームでの表現|
|---|---|---|---|
|UI-01|応募ステータス選択|SCR-02、SCR-03、States|全ステータスを選択候補とする選択UIと更新操作。同一ステータスでは更新不可|
|UI-02|案件削除確認|SCR-03、States|案件削除を確認するモーダル。キャンセルと削除確定を表示|
|UI-03|エージェント会社削除確認|SCR-07、States|関連Jobが存在しない場合に表示する確認モーダル|
|UI-04|エージェント会社削除不可案内|SCR-07、States|関連Jobが存在するため削除できない理由と関連案件への導線|
|UI-05|ログアウト操作|SCR-02〜SCR-09、States|共通ナビゲーションまたはモバイルメニューから開始するログアウト操作|

## 7. 代表的な画面状態

代表状態は、Figmaの`States / Content`にまとめている。

- ローディング
- 案件一覧の空状態
- エージェント会社一覧の空状態
- 入力エラー
- 通信エラー
- 保存中
- 保存成功
- 保存失敗
- UI-01 応募ステータス更新
- UI-02 案件削除確認
- UI-03 エージェント会社削除確認
- UI-04 エージェント会社削除不可案内
- UI-05 ログアウト確認

[代表的な画面状態のPNG](wireframes/states/representative-states.png)

エラー文言、成功メッセージの表示時間および詳細なバリデーション文言は確定していない。ワイヤーフレーム上の文言は、表示位置と情報の優先順位を確認するための例示である。

## 8. 主要プロトタイプ接続

Figmaでは、次の主要フローについて画面間または画面内UIへの接続を設定している。

|フロー|主な接続|
|---|---|
|ログイン|SCR-01 → SCR-02|
|案件の確認|SCR-02 → SCR-03|
|案件の登録|SCR-02 → SCR-04 → SCR-03|
|案件の編集|SCR-03 → SCR-05 → SCR-03|
|案件の削除|SCR-03 → UI-02 → SCR-02、キャンセル時はSCR-03に留まる|
|応募ステータス更新|SCR-02またはSCR-03 → UI-01 → 現在の画面に留まる|
|エージェント会社の確認|SCR-06 → SCR-07|
|エージェント会社の登録|SCR-06 → SCR-08 → SCR-07|
|エージェント会社の編集|SCR-07 → SCR-09 → SCR-07|
|エージェント会社の削除|SCR-07 → UI-03 → SCR-06、またはUI-04から関連案件を確認|
|ログアウト|SCR-02〜SCR-09 → UI-05 → SCR-01|

接続は主要フローをレビューするためのものであり、トランジションの時間やアニメーション仕様を確定するものではない。

## 9. 共通要素

FigmaのComponents区分では、低忠実度ワイヤーフレームに必要な範囲で次の共通要素を整理している。

- Header / Desktop
- Header / Mobile
- Button
- Text Input
- Select
- Status Badge
- Table Row / Desktop
- Card / Mobile
- Alert
- Modal
- Loading Placeholder
- Empty State
- Form Field

デスクトップではヘッダー上のナビゲーション、スマートフォンではメニューから主要画面とログアウトへ移動する構成とした。これらは情報構造および操作導線を確認するための共通要素であり、実装コンポーネントの分割単位を確定するものではない。

## 10. 既存資料から確定した内容

- ログイン成功後はSCR-02 案件一覧画面へ移動する
- 登録画面と編集画面は独立画面とする
- 案件の登録・編集成功後はSCR-03 案件詳細画面へ移動する
- エージェント会社の登録・編集成功後はSCR-07 エージェント会社詳細画面へ移動する
- 削除成功後は対象の一覧画面へ移動する
- 削除確認は独立画面ではなく、確認ダイアログまたはモーダルとする
- Job登録時に、ステータスが「未応募」のApplicationを自動作成する
- Jobは論理削除し、関連するApplicationおよびステータス変更履歴を保持する
- 関連Jobが存在するAgentCompanyは削除できない
- 応募ステータスはSCR-02またはSCR-03で更新し、更新後も現在の画面に留まる
- Sprint 1では通常の次ステータスを優先表示しない
- 現在と同じ応募ステータスを選択した場合は更新できず、更新日時と履歴も変更しない
- 未認証状態で保護対象画面を利用できない
- スマートフォンではログイン、ログアウト、一覧・詳細閲覧、応募ステータス更新を利用可能とする
- スマートフォンでは登録、編集、削除を利用不可とする

## 11. PMが承認したワイヤーフレーム反映方針

次の項目は、既存資料だけでは具体的な形式を確定できなかったため、Developer案をPMが確認し、DESIGN-03の低忠実度ワイヤーフレームへ反映する方針として承認したものである。

- 共通ナビゲーションは、デスクトップではヘッダー、スマートフォンではメニューとして表現する
- 一覧では、対象の識別、関連先、現在状態および詳細への導線を優先する
- 詳細では、基本情報、条件・連絡先、関係情報、関連情報を意味のまとまりごとに分ける
- 登録・編集フォームでは、関連する入力項目をグルーピングする
- 削除確認はモーダルとして表現する
- 応募ステータス更新は選択UIと更新操作を組み合わせる
- 成功・エラー結果は、操作箇所付近または画面上部で確認できるようにする
- スマートフォンでは閲覧とステータス更新に必要な情報を優先する
- スマートフォンで利用できない登録・編集・削除は、デスクトップで利用できる旨を案内する
- Figma無料プランの制約に対応するため、5つの論理区分を3ページへ統合する

上記はワイヤーフレームレビューのための配置方針である。最終文言、ビジュアル、実装方法までを確定するものではない。

## 12. 後続設計で決定する内容

- 認証方式とログイン画面の具体的な入力項目
- 一覧・詳細に表示する全項目と最終的なラベル
- フォームの全入力項目、必須項目、最大長、入力形式および詳細なバリデーション
- 成功・エラーメッセージの最終文言、表示時間および閉じ方
- URLおよびルーティングパス
- APIパス、リクエスト・レスポンス、エラー形式
- DBのテーブル・カラム構成
- フロントエンドのコンポーネント構成
- レスポンシブ対応の具体的なブレークポイント
- 色、フォント、アイコン、余白などの最終的なビジュアル仕様
- キーボード操作時の詳細なフォーカス順、フォーカストラップおよび読み上げ文言
- ステータス変更履歴の表示方法（履歴表示画面はSprint 4の対象）

## 13. 書き出し画像

### 13.1 Desktop

- [SCR-01 ログイン](wireframes/desktop/scr-01-login.png)
- [SCR-02 案件一覧](wireframes/desktop/scr-02-job-list.png)
- [SCR-03 案件詳細](wireframes/desktop/scr-03-job-detail.png)
- [SCR-04 案件登録](wireframes/desktop/scr-04-job-create.png)
- [SCR-05 案件編集](wireframes/desktop/scr-05-job-edit.png)
- [SCR-06 エージェント会社一覧](wireframes/desktop/scr-06-agent-company-list.png)
- [SCR-07 エージェント会社詳細](wireframes/desktop/scr-07-agent-company-detail.png)
- [SCR-08 エージェント会社登録](wireframes/desktop/scr-08-agent-company-create.png)
- [SCR-09 エージェント会社編集](wireframes/desktop/scr-09-agent-company-edit.png)

### 13.2 Mobile

- [SCR-01 ログイン](wireframes/mobile/scr-01-login.png)
- [SCR-02 案件一覧](wireframes/mobile/scr-02-job-list.png)
- [SCR-03 案件詳細](wireframes/mobile/scr-03-job-detail.png)
- [SCR-06 エージェント会社一覧](wireframes/mobile/scr-06-agent-company-list.png)
- [SCR-07 エージェント会社詳細](wireframes/mobile/scr-07-agent-company-detail.png)

### 13.3 States

- [代表的な画面状態](wireframes/states/representative-states.png)

## 14. 関連資料

- [Sprint 1 ユーザーフロー](sprint1-user-flows.md)
- [Sprint 1 画面一覧](sprint1-screen-list.md)
- [Sprint 1 画面遷移](sprint1-screen-transitions.md)
- [要求定義書](../requirements/revised-product-requirements.md)

## 15. レビュー時の確認結果

- SCR-01〜SCR-09と画面一覧の画面IDが一致している
- デスクトップ9画面、スマートフォン5画面、代表状態をFigma最新版からPNGで書き出している
- PNGの寸法がFigmaフレームと一致している
- PNGにFigmaのエディターUIや隣接フレームが混入していない
- 文字および操作要素がフレーム外で見切れていない
- 画面遷移が`docs/design/sprint1-screen-transitions.md`の遷移方針と矛盾していない
- スマートフォンの利用範囲が`docs/design/sprint1-screen-list.md`と一致している
- 未決事項は注記またはプレースホルダーとして表現し、製品仕様として確定していない

