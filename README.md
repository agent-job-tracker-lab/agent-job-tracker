# Agent Job Tracker

エージェント会社から紹介された案件と応募状況を一元管理する、Sprint 1向けのWebアプリケーションです。

現在はSprint 0の開発準備段階です。このリポジトリには、要件・設計資料とSprint 1実装を開始するためのローカル開発環境が含まれます。

## 採用技術

- Node.js 24 LTS
- Next.js 16（App Router） / React 19 / TypeScript
- Tailwind CSS 4
- PostgreSQL 18 / Prisma ORM 7
- Better Auth
- Vitest / React Testing Library / Playwright
- pnpm

詳細な選定理由は[`docs/design/sprint1-technical-architecture.md`](docs/design/sprint1-technical-architecture.md)を参照してください。

## 前提ツール

- Node.js `24.11.1`
- Corepack
- Docker DesktopまたはDocker Engine（Compose v2対応）

```bash
node --version
corepack enable
corepack prepare pnpm@11.23.0 --activate
pnpm --version
docker --version
docker compose version
```

## 初回セットアップ

1. 依存関係をインストールします。

   ```bash
   pnpm install --frozen-lockfile
   ```

2. 環境変数ファイルを作成します。

   ```bash
   cp .env.example .env
   ```

   `.env`の値はローカル開発専用です。実在する認証情報や本番Secretをコミットしないでください。

3. PostgreSQLを起動します。

   ```bash
   pnpm db:up
   pnpm db:health
   ```

4. Migrationを適用し、Prisma Clientを生成します。

   ```bash
   pnpm db:migrate
   pnpm db:generate
   ```

5. 必要に応じて、機密情報を含まない開発用ダミーデータを投入します。

   ```bash
   pnpm db:seed
   ```

6. 開発サーバーを起動します。

   ```bash
   pnpm dev
   ```

   [http://localhost:3000](http://localhost:3000)を開きます。

## 初期ユーザーの作成

Sprint 1ではpublicなサインアップを提供しません。初期ユーザーはserver-side bootstrapコマンドで1回だけ作成します。

`.env`の次の値をローカル用に設定してください。

```dotenv
BOOTSTRAP_USER_EMAIL=developer@example.test
BOOTSTRAP_USER_NAME=Local Developer
BOOTSTRAP_USER_PASSWORD=十分に長いローカル専用パスワード
```

その後、次を実行します。

```bash
pnpm auth:bootstrap
```

- Better Authのserver APIを通すため、パスワードはhashだけがDBへ保存されます。
- Email、Password、hash、Session tokenをGitへ追加しないでください。
- Userが既に1件存在する場合は安全のため失敗します。既存Userを削除・上書きするoptionはありません。

## 日常的に使うコマンド

| コマンド                 | 用途                                                  |
| ------------------------ | ----------------------------------------------------- |
| `pnpm dev`               | 開発サーバーを起動                                    |
| `pnpm build`             | production build                                      |
| `pnpm start`             | build済みアプリを起動                                 |
| `pnpm lint`              | ESLint                                                |
| `pnpm format`            | Prettierで整形                                        |
| `pnpm format:check`      | 整形差分の確認                                        |
| `pnpm typecheck`         | TypeScript型チェック                                  |
| `pnpm test`              | unit/component test                                   |
| `pnpm test:e2e`          | ChromiumでE2E smoke test                              |
| `pnpm check`             | lint、format、typecheck、unit test、buildを順番に実行 |
| `pnpm db:up`             | PostgreSQLをbackground起動                            |
| `pnpm db:down`           | PostgreSQL containerを停止・削除（volumeは保持）      |
| `pnpm db:health`         | PostgreSQLのhealth check                              |
| `pnpm db:generate`       | Prisma Client生成                                     |
| `pnpm db:migrate`        | 開発DBへMigration適用                                 |
| `pnpm db:migrate:deploy` | 既存Migrationを適用                                   |
| `pnpm db:seed`           | 開発用ダミーデータを冪等投入                          |
| `pnpm db:studio`         | Prisma Studio                                         |
| `pnpm auth:bootstrap`    | 初期Userを1回だけ作成                                 |

DB volumeを含むresetはデータを削除するため、自動化していません。必要な場合は対象環境を確認してから明示的に実施してください。

## テスト

unit testとbuildはDBなしで実行できます。

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
```

E2Eを初めて実行する端末では、Chromiumを導入します。

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

Playwrightは`pnpm test:e2e`の実行中にNext.js development serverを起動します。

開発サーバーはNext.js 16標準のTurbopackを使用します。production buildは、PostCSSを含むbuildを実行環境に依存せず再現できるよう、現時点ではNext.jsが正式に提供するwebpack modeへ固定しています。

## DB設計上の注意

- PostgreSQL 18の`uuidv7()`で全IDを生成します。
- Prisma Migrationを唯一のschema適用経路とします。共有環境へ`prisma db push`は使用しません。
- `application_status_histories`はDB triggerでもUPDATE・DELETEを拒否します。
- 業務seedと初期User bootstrapは分離しています。

物理設計の根拠は[`docs/design/sprint1-physical-data-model.md`](docs/design/sprint1-physical-data-model.md)を参照してください。

## トラブルシューティング

### PostgreSQLへ接続できない

```bash
docker compose ps
docker compose logs db
pnpm db:health
```

port `5432`が使用中の場合は、`.env`と`compose.yaml`の接続先を同じ値に調整してください。リポジトリの標準値は`5432`です。

### Prisma Clientのimport errorが出る

```bash
pnpm db:generate
```

`src/generated/prisma/`は生成物のためGit管理しません。

### Node.jsまたはpnpmのversionが違う

`.node-version`と`package.json`の`packageManager`に合わせてください。依存関係更新はlockfileを含む専用PRで行います。
