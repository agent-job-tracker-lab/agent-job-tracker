# ローカル開発環境 再現確認結果

## 1. 目的

本書は、Git管理外の既存設定・生成物・DBへ依存せず、READMEの手順からAgent Job Trackerのローカル開発環境を再現できるか確認した結果を記録する。

Sprint 0親Issue #2の受け入れ条件「別の開発者がREADMEの手順でローカル環境を起動できる」に対し、実際の別人・別端末ではなく、Codexが既存workspaceと分離したクリーンcloneで代替検証した。

---

## 2. 検証条件

|項目|内容|
|---|---|
|実施日|2026-08-24|
|Issue|#44 `[TEST-01] README手順でローカル開発環境を再現確認する`|
|検証対象commit|`41a9a223f52cd284f63a0ccccc119f7a8755fd73`|
|検証対象branch|`main`|
|OS|macOS 15.7.3 / Darwin arm64|
|Node.js|24.11.1|
|Corepack|0.34.2|
|project指定pnpm|11.23.0|
|Docker|29.6.2|
|Docker Compose|5.3.1|
|検証clone|`/private/tmp/agent-job-tracker-test-01.HCLZtR`|
|Compose project|`agent_job_tracker_test01`|
|DB volume|`agent_job_tracker_test01_postgres_data`|

検証開始時に、一時cloneに`.env`、`node_modules`および生成済みPrisma Clientが存在しないことを確認した。DBは専用のCompose project名と新規volumeを使用し、既存workspaceのDBから分離した。

---

## 3. 実行結果

|区分|実行内容|結果|
|---|---|---|
|clone|最新`main`を空の一時directoryへclone|成功|
|package manager|`corepack pnpm --version`|成功、11.23.0|
|依存関係|`corepack pnpm install --frozen-lockfile`|成功、664 packages|
|環境変数|`.env.example`から`.env`を作成|成功|
|DB起動|`corepack pnpm db:up`|成功、専用network・volumeを新規作成|
|DB health|`corepack pnpm db:health`|成功、accepting connections|
|Migration|`corepack pnpm db:migrate`|成功、3 migrations適用|
|Prisma Client|`corepack pnpm db:generate`|成功、Prisma Client 7.9.1生成|
|seed|`corepack pnpm db:seed`|成功|
|初期User|`corepack pnpm auth:bootstrap`|成功|
|bootstrap再実行|同commandを2回目に実行|想定どおりexit 1で拒否し、既存Userを上書きしない|
|開発server|`corepack pnpm dev`|成功、Next.js 16.3.2起動|
|HTTP|`http://localhost:3000`|HTTP 200|
|lint|`corepack pnpm lint`|成功|
|format|`corepack pnpm format:check`|成功|
|typecheck|`corepack pnpm typecheck`|成功|
|unit test|`corepack pnpm test`|1 file / 1 test成功|
|build|`corepack pnpm build`|成功|
|browser準備|`corepack pnpm exec playwright install chromium`|成功|
|E2E|`corepack pnpm test:e2e`|Chromium 1 test成功|
|DB停止|`corepack pnpm db:down`|container・networkの停止と削除に成功|

品質checkは`corepack pnpm check`でも一括実行し、lint、format、typecheck、unit testおよびbuildがすべて成功した。

---

## 4. 発見事項と対応

### 4.1 `corepack enable`が環境によって権限エラーになる

READMEに記載されていた`corepack enable`は、Corepackがsystem管理の`/usr/local/bin`へshimを作成しようとしたため、次のエラーで失敗した。

```text
EACCES: permission denied, symlink ... -> '/usr/local/bin/pnpm'
```

これはapplicationやlockfileの問題ではなく、Node.js / Corepackのinstall先がuser書込可能かどうかに依存する手順上の問題である。管理者権限を前提にすると、別Developerの環境で再現できない可能性がある。

以下の方針でREADMEを修正した。

- `corepack enable`と`corepack prepare`を必須手順から除外する
- commandを`corepack pnpm`経由で実行する
- `package.json`の`packageManager`からpnpm 11.23.0を選択させる
- user管理のpnpm shimがある場合だけ、短縮形の`pnpm`へ読み替え可能と説明する

修正後の方式ではglobal directoryへの書き込みが不要であり、実際に`corepack pnpm --version`が11.23.0を選択し、初回setupからE2Eまで成功した。

---

## 5. クリーン環境としての確認

- 最新mainから新規cloneした
- clone直後に`.env`と`node_modules`が存在しないことを確認した
- Git管理対象の`.env.example`からローカル設定を作成した
- 新規のCompose project、network、container、volumeを使用した
- 既存workspaceの`.env`、生成済みClient、node_modulesおよびDB volumeを参照しなかった
- 検証後、一時DB containerとnetworkを削除した
- DB volumeはREADMEの`db:down`仕様どおり保持した
- 一時cloneのGit管理対象ファイルに差分がないことを確認した

---

## 6. 検証上の制約

この検証は、実際の別Developer・別端末による確認ではない。次のhost資源は既存環境と共有している。

- OSとDocker Engine
- pnpmのcontent-addressable store
- Playwright browser cache
- network接続

一方、repository checkout、`.env`、node_modules、Prisma生成物、Compose project、containerおよびDB volumeは分離した。このため、Git管理対象とREADMEだけからsetupできること、および既存project固有の生成物・DBに依存しないことは確認できた。

実際の別人・別端末、別OSでの再現性を保証するものではない。チームへ別Developerが参加した場合は、その端末でREADMEを再確認する。

---

## 7. 結論

READMEで発見したCorepackの権限依存を修正した後、クリーンcloneで以下を再現できた。

- 依存関係install
- PostgreSQL起動とMigration
- Prisma Client生成、seed、初期User作成
- 開発server起動とHTTP 200応答
- lint、format、typecheck、unit test、build
- Chromium E2E smoke test
- containerとnetworkの安全な停止・削除

実際の別人による確認ではないという制約を残すが、Sprint 1実装を開始するためのローカル環境が、既存workspaceの暗黙状態へ依存せず再現できることを確認した。
