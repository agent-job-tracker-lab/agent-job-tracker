# Sprint 1 入力検証・エラー詳細設計

## 1. 文書情報

|項目|内容|
|---|---|
|対応Issue|DESIGN-08|
|対象|Agent Job Tracker Sprint 1|
|目的|画面、REST API、Zod schema、業務rule、DB constraintおよび自動testで共有する入力・error契約を定める|
|前提|Next.js 16、TypeScript、Zod 4、Prisma ORM 7、Better Auth、PostgreSQL 18|
|位置付け|入力・error詳細設計。Zod schema、formおよびRoute Handlerの実装は後続Issueで行う|

本書はDESIGN-04のAPI概要、DESIGN-05・07のdata model、DESIGN-06の認証設計およびSCR-01〜09・UI-01〜05を入力とする。

既存資料から確定できる製品要件、Developerが提案する具体値、PMレビュー対象、後続実装で検証する事項を区別する。

---

## 2. 対象範囲

### 2.1 対象

- AUTH-01、AC-01〜05、JOB-01〜05、APP-01〜02のrequest validation
- SCR-01、SCR-04、SCR-05、SCR-08、SCR-09およびUI-01のform validation
- JSON body、path parameter、query parameter、PATCHおよびpaginationの共通rule
- AgentCompany、Job、LoginおよびApplication statusのfield rule
- 共通error response、HTTP status、application error codeおよびfield error code
- 画面でのerror表示、入力保持、focusおよびretry方針
- Zod、Application ServiceおよびDB constraintの責務分担
- Unit、Integration、ComponentおよびE2E test観点

### 2.2 対象外

- Zod schema、React form、Route Handler、error classおよびtest codeの実装
- Prisma schema、MigrationおよびDB constraintの実装
- 検索・絞り込み条件
- Password変更、Password reset、Email verification、sign-upおよびMFA
- file upload、CSV取込、外部APIおよびwebhook
- Sprint 2以降のfield
- 最終visual design、toast libraryおよびform libraryの選定
- log vendor、保持期間およびalert threshold

---

## 3. 決定区分

|区分|意味|
|---|---|
|確定要件|要求定義書またはDESIGN-01〜07でPM承認済みの製品仕様|
|Developer採用案|既存仕様を実装・test可能にする具体的なvalidation・error案|
|PMレビュー対象|入力可否や保存値に影響し、既存資料だけでは一意に決まらない具体値|
|後続実装事項|library version、実装配置、browser挙動など、codeと実環境で確認する事項|

---

## 4. 既存資料から確定できる内容

- LoginはEmail addressとPasswordを使用する
- Login失敗時はEmailとPasswordのどちらが原因か明かさない
- Login失敗後はPasswordだけをclearし、Emailは修正できる状態で保持する
- Loginは10秒3回にrate limitする
- AgentCompanyは`companyName`と`status`が必須で、状態初期値は`ACTIVE`である
- AgentCompanyの会社名重複を許可する
- AgentCompanyのその他の登録・編集項目は任意である
- Jobは`jobName`、`agentCompanyId`、`workStyle`が必須である
- `workStyle`はdefaultを持たず、`UNKNOWN`を含む定義済み値から明示選択する
- 月額単価は下限・上限の両方、片方だけ、両方なしを許可し、両方ある場合は下限以下・上限以上の順とする
- 画面では単価を万円単位で入力・表示し、DBでは円単位integerで保存する
- 稼働率はDBで0〜100の百分率として保持する
- 技術・担当工程は配列、必須・歓迎条件は長文として保持する
- Job作成requestはApplication statusを受け付けず、serverが`NOT_APPLIED`を設定する
- Application statusは定義済み9値だけで、現在値に関係なく別の全statusへ変更できる
- 同じApplication statusは`409`とし、Application、更新日時および履歴を変更しない
- 一覧は`page`と`pageSize`のページ番号方式を使用する
- Sprint 1では検索・絞り込みparameterを提供しない
- Validation errorは共通形式でfield path、codeおよびmessageを返す
- 内部例外、SQL、stack trace、Password、Cookieおよびcredentialをresponseへ含めない

---

## 5. Validationの責務分担

|層|責務|例|
|---|---|---|
|Form adapter|HTML input文字列を共有schemaの入力型へ明示変換する|万円文字列、日付文字列、空欄|
|Client validation|送信前に利用者が修正できるfield errorを表示する|必須、形式、最大長、値域|
|Route Handler / Zod|外部requestを信用せず、型・形式・field・値域・field間条件を再検証する|JSON、UUID、enum、range|
|Application Service|現在のDB状態が必要な業務ruleを検証する|対象存在、削除済み、同一status、関連Job|
|Repository / DB|参照整合性、一意性、行内制約を最後に保証する|FK、UNIQUE、CHECK、enum|
|Presentation|error codeを決定済みの日本語messageと画面状態へ変換する|field error、form error、redirect|

Client validation成功をserver validationの代わりにしない。Server ComponentからApplication Serviceを直接呼ぶ場合も、browser由来の値には同じ共有schemaを適用する。

DB errorをそのままHTTPへ返さず、既知のconstraint違反はdomain errorへ変換し、未知のDB errorは`INTERNAL_ERROR`へ変換する。

---

## 6. 共通request規則

### 6.1 HTTP body

- POST・PATCHでbodyを使用するendpointは`Content-Type: application/json`だけを受け付ける
- charset parameter付き`application/json; charset=utf-8`は受け付ける
- その他は`415 UNSUPPORTED_MEDIA_TYPE`とする
- 必須bodyが空の場合は`400 REQUEST_BODY_REQUIRED`とする
- JSONとしてparseできない場合は`400 INVALID_JSON`とする
- JSON rootはobjectだけを受け付け、array・string・number・boolean・nullは`422 VALIDATION_ERROR`とする
- request objectはstrictとし、未定義fieldを`UNKNOWN_FIELD`として拒否する
- DELETE、GETおよびAUTH-02はbodyを使用しない。bodyが送られても業務dataとして解釈しない
- JSON body上限は64 KiBとし、超過時は`413 REQUEST_TOO_LARGE`とするDeveloper案である

64 KiBはSprint 1のtext fieldと配列上限を十分に収容し、誤送信や過大payloadを早期に拒否するためのapplication上限である。Hosting側上限が小さい場合は小さい方を適用する。

### 6.2 未指定、NULL、空文字

|field種別|POSTで未指定|POSTで`null`|POSTで空文字|PATCHで未指定|PATCHで`null`・空文字|
|---|---|---|---|---|---|
|必須string・enum・ID|REQUIRED|REQUIRED|trim後REQUIRED|変更なし|REQUIRED|
|任意string・date・number|`null`として保存|`null`|trim後`null`|変更なし|値をclearして`null`|
|任意array|空配列|空配列|型error|変更なし|空配列へclear|

- 空文字の判定は対象fieldの正規化後に行う
- Passwordだけはtrim・Unicode正規化をせず、空文字をそのまま必須errorとする
- PATCHは部分更新とし、必須fieldも未指定なら既存値を維持する
- PATCHで認識可能な更新fieldが1件もない場合は`EMPTY_UPDATE`とする
- `createdAt`、`updatedAt`、`deletedAt`、ID、Application status履歴などserver管理fieldはrequestで受け付けない
- `applicationStatus`または`currentStatus`をJOB-03・04へ送った場合は`UNKNOWN_FIELD`とする

### 6.3 String正規化

Passwordを除くbusiness stringでは次の順で正規化する。

1. `\r\n`と`\r`を`\n`へ統一する
2. UnicodeをNFCへ正規化する
3. field全体の前後にあるUnicode whitespaceを除去する
4. single-line fieldでは改行を拒否する
5. 正規化後のUnicode code point数を数える

内部の連続空白や改行は勝手に1つへ変換しない。利用者が入力した長文の段落を保持する。

最大長はUTF-8 byte数やJavaScript UTF-16 code unit数ではなくUnicode code point数で判定する。Clientとserverで同じhelperを使用する。HTMLの`maxlength`は入力支援に使えるが、server判定の代わりにしない。

### 6.4 ID

- APIではIDを文字列として受け付ける
- path・bodyともcanonical UUID形式`8-4-4-4-12`を要求し、英字は小文字へ正規化する
- UUID versionをrequest validationでは限定しない。形式が正しく存在しないIDは`404`とする
- path IDの形式不正は`400 INVALID_PATH_PARAMETER`とする
- body内IDの形式不正は`422 VALIDATION_ERROR`とし、対象fieldへ`INVALID_FORMAT`を返す

UUID v7であることを外部契約にしないため、将来のID方式変更でAPI validationを壊さない。

### 6.5 日付

- `lastContactDate`は`YYYY-MM-DD`の10文字だけを受け付ける
- zero paddingを必須とし、実在するGregorian calendar日付を検証する
- timezoneを付けない
- 未来日は「最終連絡日」の意味に合わないため受け付けない
- 「今日」は`Asia/Tokyo`のcalendar dateを基準とする
- 任意fieldのため`null`または空欄でclearできる

### 6.6 列挙値

- APIはDESIGN-07で定義した英大文字`snake_case`値だけを受け付ける
- 日本語labelや大小文字違いをserverで暗黙変換しない
- Clientはlabelと送信値を分離する
- 未定義値は`INVALID_ENUM`とする

### 6.7 Number

- JSON APIの数値fieldはJSON numberだけを受け付け、文字列から暗黙coerceしない
- `NaN`、`Infinity`および`-Infinity`はJSON表現として認めない
- Form adapterは送信前に入力文字列を明示parseし、失敗時はAPIを呼ばない
- 整数fieldは小数、指数表記文字列および符号だけの値を受け付けない
- 暗黙の丸め、切捨ておよび桁あふれを行わない

### 6.8 Array

- JSON arrayだけを受け付け、comma区切りstringを暗黙分割しない
- 各要素をstring正規化してから必須・最大長を検証する
- 正規化後に空となる要素を許可しない
- 正規化後の完全一致で重複する要素を`DUPLICATE_ITEM`として拒否する
- 順序を保持する
- `null`と空配列はclearの意味で統一する

---

## 7. Paginationとquery parameter

|Parameter|必須|型|default|範囲|error|
|---|---|---|---|---|---|
|`page`|任意|10進正整数|1|1以上|`INVALID_QUERY_PARAMETER`|
|`pageSize`|任意|10進正整数|20|1〜100|`INVALID_QUERY_PARAMETER`|

- `1.0`、`1e2`、`+1`、空文字、重複parameterを受け付けない
- Sprint 1では`search`、`status`、`sort`など未定義queryを受け付けない
- unknown queryは`400 INVALID_QUERY_PARAMETER`とする
- `totalCount = 0`では`totalPages = 0`とし、`page = 1`を返す
- total pagesを超えるpageはerrorにせず、空の`items`とrequestされたpageInfoを返す
- sortは`createdAt DESC, id DESC`で固定する

標準20件は100件程度の通常dataを5pageで確認でき、desktop・mobile双方で一度に過剰なdataを返さないDeveloper案である。最大100件は通常規模を1回で取得できる上限とする。

AgentCompany詳細に含める関連Job概要はlist APIの`pageSize`対象外とし、Sprint 1では関連する全件を返す。通常data量は100件程度を前提とするが、responseを暗黙truncateしない。data量が増えた場合は独立paginationを後続Sprintで再設計する。

---

## 8. Login入力

### 8.1 AUTH-01 request

```json
{
  "email": "user@example.com",
  "password": "example-password"
}
```

|Field|必須|入力型|正規化・制約|Field error|
|---|---|---|---|---|
|`email`|必須|string|trim、NFC、ASCII英字を小文字化、Email形式、最大254 code points、改行不可|`REQUIRED`、`INVALID_FORMAT`、`TOO_LONG`|
|`password`|必須|string|trim・正規化なし、Better Authと同じUTF-16 code unitで8〜128|`REQUIRED`、`TOO_SHORT`、`TOO_LONG`|

Email format validationは明らかな入力mistakeを検出する範囲とし、DNS問い合わせやmailbox存在確認を行わない。Login時の正規化は初期User bootstrapと同じhelperを通す。

### 8.2 Login error

- EmailまたはPasswordがDB上不一致の場合は、どちらが原因でも`401 INVALID_CREDENTIALS`とする
- messageは「メールアドレスまたはパスワードが正しくありません。」とする
- Userの存在、Email verification状態、Password hash状態をresponse差分で明かさない
- Login失敗後はEmailを保持し、Passwordだけをclearする
- 10秒3回を超えた場合は`429 RATE_LIMITED`と標準`Retry-After` headerを返す。Better Auth内部の`X-Retry-After`はadapterで標準headerへ変換する
- Rate limit messageは「試行回数が上限に達しました。しばらく待ってからもう一度お試しください。」とする
- Better Authの内部error codeとmessageをBrowserへ直接返さず、本書のcodeへadapterする

Bootstrap用Passwordも8〜128を下限とするが、実際には十分に長いrandom値を使用する。Passwordをvalidation error、log、analyticsまたはtest snapshotへ含めない。

---

## 9. AgentCompany入力

### 9.1 Field rule

|Field|必須|API型|正規化・制約|NULL・clear|Field error|
|---|---|---|---|---|---|
|`companyName`|必須|string|single-line、1〜200 code points|不可|`REQUIRED`、`TOO_LONG`、`INVALID_FORMAT`|
|`contactName`|任意|string|single-line、最大100|可|`TOO_LONG`、`INVALID_FORMAT`|
|`contactDetails`|任意|string|multi-line、最大500|可|`TOO_LONG`|
|`characteristics`|任意|string|multi-line、最大2000|可|`TOO_LONG`|
|`lastContactDate`|任意|string|実在する`YYYY-MM-DD`、JSTの今日以前|可|`INVALID_DATE`、`FUTURE_DATE`|
|`status`|必須|string|`ACTIVE`、`ON_HOLD`、`ENDED`|不可|`REQUIRED`、`INVALID_ENUM`|

会社名の重複はerrorにしない。`contactDetails`はSprint 1で単一textのため、Email・電話番号の厳密な形式検証を行わない。誤ってURL、電話、Emailが混在しても保存可能とし、構造化は後続要件とする。

### 9.2 AC-03 POST

- `companyName`と`status`を必須とする
- SCR-08は初期表示で`status = ACTIVE`を選択済みにするが、API requestではstatusを明示する
- 任意fieldの未指定、`null`、正規化後空文字はDBのNULLへ統一する
- Server管理fieldとunknown fieldを拒否する

### 9.3 AC-04 PATCH

- 上表のfieldだけを部分更新できる
- `companyName`と`status`は未指定なら既存値を維持する
- `companyName`と`status`を`null`または空文字へ変更できない
- その他のfieldは`null`または空文字でclearできる
- 更新fieldが0件なら`422 VALIDATION_ERROR / EMPTY_UPDATE`とする
- 更新後の会社名が別recordと同じでも許可する

### 9.4 AC-01・02・05

- AC-01は共通paginationだけを受け付ける
- AC-02・05は`agentCompanyId` pathだけを検証する
- 削除済みを通常APIから参照した場合は存在しない場合と同じ`404 AGENT_COMPANY_NOT_FOUND`とする
- AC-05で論理削除済みを含む関連Jobがある場合は`409 AGENT_COMPANY_HAS_JOBS`とする

---

## 10. Job入力

### 10.1 Field rule

|Field|必須|API型|正規化・制約|NULL・clear|Field error|
|---|---|---|---|---|---|
|`jobName`|必須|string|single-line、1〜200 code points|不可|`REQUIRED`、`TOO_LONG`、`INVALID_FORMAT`|
|`agentCompanyId`|必須|string|UUID、未削除AgentCompanyを参照|不可|`REQUIRED`、`INVALID_FORMAT`|
|`companyName`|任意|string|single-line、最大200|可|`TOO_LONG`、`INVALID_FORMAT`|
|`commercialFlow`|任意|string|multi-line、最大1000|可|`TOO_LONG`|
|`monthlyRateMinYen`|任意|integer|0〜100,000,000円、100円単位|可|`INVALID_TYPE`、`OUT_OF_RANGE`、`INVALID_INCREMENT`|
|`monthlyRateMaxYen`|任意|integer|0〜100,000,000円、100円単位|可|同上|
|`workStyle`|必須|string|`FULL_REMOTE`、`HYBRID`、`ONSITE`、`UNKNOWN`|不可|`REQUIRED`、`INVALID_ENUM`|
|`workStyleNotes`|任意|string|multi-line、最大500|可|`TOO_LONG`|
|`prefecture`|任意|string|定義済み47都道府県の日本語名称|可|`INVALID_ENUM`|
|`city`|任意|string|single-line、最大100|可|`TOO_LONG`、`INVALID_FORMAT`|
|`nearestStation`|任意|string|single-line、最大100|可|`TOO_LONG`、`INVALID_FORMAT`|
|`locationNotes`|任意|string|multi-line、最大500|可|`TOO_LONG`|
|`utilizationPercent`|任意|number|0〜100、小数2桁以内|可|`INVALID_TYPE`、`OUT_OF_RANGE`、`TOO_MANY_DECIMALS`|
|`technologies`|任意|string[]|最大20件、各1〜50 code points、重複不可|空配列へclear|`TOO_MANY_ITEMS`、`TOO_LONG`、`DUPLICATE_ITEM`|
|`processPhases`|任意|string[]|最大20件、各1〜50 code points、重複不可|空配列へclear|同上|
|`requiredConditions`|任意|string|multi-line、最大5000|可|`TOO_LONG`|
|`preferredConditions`|任意|string|multi-line、最大5000|可|`TOO_LONG`|

### 10.2 単価のform・API・DB変換

|層|Field|表現|
|---|---|---|
|Form|`monthlyRateMinManYen`、`monthlyRateMaxManYen`|0〜10,000万円のdecimal文字列、小数2桁以内|
|API|`monthlyRateMinYen`、`monthlyRateMaxYen`|0〜100,000,000の100円単位integer|
|DB|同名物理column|PostgreSQL integer、円単位|

Form adapterは正規表現`^(0|[1-9][0-9]{0,4})(\.[0-9]{1,2})?$`相当で検証し、decimalとして10,000倍する。JavaScript floating-pointへ一度変換して丸めず、文字列の整数部・小数部から円integerを組み立てる。

例：

|Form|API・DB|
|---|---|
|`60`|`600000`|
|`60.5`|`605000`|
|`60.25`|`602500`|
|空欄|`null`|

小数3桁、負数、comma、通貨記号、全角数字、指数表記および100円未満の端数を受け付けない。暗黙変換せず、利用者に修正を求める。

両方がある場合は`monthlyRateMinYen <= monthlyRateMaxYen`を要求し、違反時は上限fieldへ`INCONSISTENT_RANGE`と「上限は下限以上で入力してください。」を表示する。

### 10.3 稼働率

- FormとAPIの表示単位はpercentとする
- Formは半角数字の0〜100、小数2桁以内を受け付ける
- APIはJSON number、DBは`numeric(5,2)`とする
- `%`記号、全角数字、範囲外および小数3桁以上を受け付けない
- 空欄、`null`は未設定とする
- `0`は有効値であり空値として扱わない

### 10.4 都道府県

次の日本語名称だけを受け付ける。

`北海道`、`青森県`、`岩手県`、`宮城県`、`秋田県`、`山形県`、`福島県`、`茨城県`、`栃木県`、`群馬県`、`埼玉県`、`千葉県`、`東京都`、`神奈川県`、`新潟県`、`富山県`、`石川県`、`福井県`、`山梨県`、`長野県`、`岐阜県`、`静岡県`、`愛知県`、`三重県`、`滋賀県`、`京都府`、`大阪府`、`兵庫県`、`奈良県`、`和歌山県`、`鳥取県`、`島根県`、`岡山県`、`広島県`、`山口県`、`徳島県`、`香川県`、`愛媛県`、`高知県`、`福岡県`、`佐賀県`、`長崎県`、`熊本県`、`大分県`、`宮崎県`、`鹿児島県`、`沖縄県`

海外、複数勤務地および勤務地不明は`prefecture = null`として、必要なら`locationNotes`へ記載する。Sprint 1では独自都道府県codeを導入しない。

### 10.5 JOB-03 POST

- `jobName`、`agentCompanyId`、`workStyle`を必須とする
- `agentCompanyId`が存在しない、または論理削除済みなら`404 AGENT_COMPANY_NOT_FOUND`とする
- `applicationStatus`、`currentStatus`、`applicationId`を受け付けない
- 任意arrayの未指定・`null`は空配列、任意scalarはNULLへ統一する
- JobとApplicationを同一transactionで作成し、validation失敗ではどちらも作成しない

### 10.6 JOB-04 PATCH

- JOB-03のJob fieldだけを部分更新できる
- 必須fieldは未指定なら既存値を維持し、`null`・空値ではclearできない
- 任意scalarは`null`・空文字、arrayは`null`・空配列でclearできる
- `agentCompanyId`変更時も未削除AgentCompanyだけを参照できる
- 紹介元変更履歴を追加しない
- `applicationStatus`を更新できない
- 更新fieldが0件なら`EMPTY_UPDATE`とする

### 10.7 JOB-01・02・05、APP-01

- JOB-01は共通paginationだけを受け付ける
- JOB-02・05、APP-01は`jobId` pathだけを検証する
- Jobがない、または論理削除済みの場合は`404 JOB_NOT_FOUND`とする
- APP-01を独立実装するかJOB-01・02へ統合するかは実装Issueで決める。どちらでもstatus responseとerror codeは同じ契約を使用する

---

## 11. Application status入力

### 11.1 APP-02 request

```json
{
  "status": "INTERVIEW_SCHEDULED"
}
```

|Field|必須|型|許容値|Error|
|---|---|---|---|---|
|`status`|必須|string|`NOT_APPLIED`、`PROPOSING`、`APPLIED`、`DOCUMENT_REVIEW`、`INTERVIEW_SCHEDULED`、`AWAITING_RESULT`、`ENGAGEMENT_CONFIRMED`、`WITHDRAWN`、`REJECTED`|`REQUIRED`、`INVALID_ENUM`|

- Status以外のfieldを受け付けない
- 現在とは異なる定義済みstatusなら遷移順に関係なく更新できる
- 現在と同じstatusなら`409 APPLICATION_STATUS_UNCHANGED`とする
- 同一statusでは`statusUpdatedAt`、`updatedAt`およびHistoryを変更しない
- Jobがない・削除済みなら`JOB_NOT_FOUND`、Applicationがないなら`APPLICATION_NOT_FOUND`とする
- Status更新とHistory作成を同じtransactionで処理する
- `changedByUserId`をrequest bodyから受け付けず、認証中sessionから取得する

---

## 12. 共通error response

### 12.1 Schema

すべてのapplication JSON errorは次の形を使用する。

```json
{
  "code": "VALIDATION_ERROR",
  "message": "入力内容を確認してください。",
  "fieldErrors": [
    {
      "field": "monthlyRateMaxYen",
      "code": "INCONSISTENT_RANGE",
      "message": "上限は下限以上で入力してください。"
    }
  ]
}
```

|Property|型|必須|規則|
|---|---|---|---|
|`code`|string|必須|機械可読なUPPER_SNAKE_CASE。表示文言の分岐に使用できる|
|`message`|string|必須|利用者向け日本語。内部情報を含めない|
|`fieldErrors`|array|必須|fieldに紐づかないerrorでは空配列|
|`fieldErrors[].field`|string|必須|request JSONのdot path。配列要素は`technologies.2`形式|
|`fieldErrors[].code`|string|必須|field error code|
|`fieldErrors[].message`|string|必須|field付近へ表示する日本語|

Error responseへrequest input値をechoしない。Clientは手元のform stateを保持する。

Zodが同一fieldへ複数issueを返した場合、正規化後の検証順で最初の修正可能な1件だけを`fieldErrors`へ採用する。Fieldの並び順は画面・request schemaの定義順とし、testで固定する。

### 12.2 Field path

- body field：`companyName`
- nested fieldを将来使用する場合：`location.prefecture`
- array item：`technologies.2`
- query：`query.pageSize`
- path：`path.jobId`
- Formだけのfield：`monthlyRateMinManYen`

API errorはAPI field名を返す。Form adapterは`monthlyRateMinYen`を対応する`monthlyRateMinManYen`へ変換して表示する。

---

## 13. HTTP statusとapplication error code

|HTTP|Application code|Message|Field errors|主な扱い|
|---|---|---|---|---|
|400|`INVALID_JSON`|リクエストの形式が正しくありません。|空|JSON parse失敗|
|400|`REQUEST_BODY_REQUIRED`|入力内容を送信してください。|空|bodyなし|
|400|`INVALID_PATH_PARAMETER`|指定されたIDの形式が正しくありません。|path field|path UUID不正|
|400|`INVALID_QUERY_PARAMETER`|一覧の指定が正しくありません。|query field|pagination・unknown query|
|401|`INVALID_CREDENTIALS`|メールアドレスまたはパスワードが正しくありません。|空|Login失敗|
|401|`AUTHENTICATION_REQUIRED`|ログインしてください。|空|Cookieなし等|
|401|`SESSION_EXPIRED`|セッションの有効期限が切れました。もう一度ログインしてください。|空|失効・期限切れ|
|403|`ORIGIN_NOT_ALLOWED`|この操作を実行できません。画面を再読み込みしてください。|空|Origin・CSRF相当の拒否|
|404|`AGENT_COMPANY_NOT_FOUND`|エージェント会社が見つかりません。|空|存在なし・削除済み|
|404|`JOB_NOT_FOUND`|案件が見つかりません。|空|存在なし・削除済み|
|404|`APPLICATION_NOT_FOUND`|応募情報が見つかりません。|空|想定外の整合性欠如|
|409|`AGENT_COMPANY_HAS_JOBS`|関連する案件があるため削除できません。状態を「終了」に変更してください。|空|削除制限|
|409|`APPLICATION_STATUS_UNCHANGED`|現在と同じステータスには更新できません。|`status`|no-op|
|409|`CONCURRENT_MODIFICATION`|他の更新と重なりました。最新の内容を確認してもう一度お試しください。|空|競合・retry不能|
|413|`REQUEST_TOO_LARGE`|入力内容が大きすぎます。内容を短くしてください。|空|64 KiB超過|
|415|`UNSUPPORTED_MEDIA_TYPE`|JSON形式で送信してください。|空|Content-Type不正|
|422|`VALIDATION_ERROR`|入力内容を確認してください。|1件以上|field validation|
|429|`RATE_LIMITED`|試行回数が上限に達しました。しばらく待ってからもう一度お試しください。|空|Login rate limit|
|500|`INTERNAL_ERROR`|処理に失敗しました。時間をおいてもう一度お試しください。|空|予期しないerror|

Routeがない場合やmethodが違う場合のNext.js標準`404`・`405`をapplication domain codeへ無理に変換しない。公開APIとして統一が必要になった時点でnot-found handlerとmethod adapterを追加する。

### 13.1 Field error code

|Code|標準message|
|---|---|
|`REQUIRED`|入力してください。|
|`INVALID_TYPE`|入力形式を確認してください。|
|`INVALID_FORMAT`|形式を確認してください。|
|`TOO_SHORT`|{min}文字以上で入力してください。|
|`TOO_LONG`|{max}文字以内で入力してください。|
|`OUT_OF_RANGE`|{min}から{max}の範囲で入力してください。|
|`TOO_MANY_DECIMALS`|小数点以下{scale}桁以内で入力してください。|
|`INVALID_INCREMENT`|{unit}単位で入力してください。|
|`INVALID_ENUM`|選択肢から選んでください。|
|`INVALID_DATE`|日付を正しく入力してください。|
|`FUTURE_DATE`|今日以前の日付を入力してください。|
|`TOO_MANY_ITEMS`|{max}件以内で入力してください。|
|`DUPLICATE_ITEM`|同じ内容が重複しています。|
|`INCONSISTENT_RANGE`|上限は下限以上で入力してください。|
|`UNKNOWN_FIELD`|使用できない項目が含まれています。|
|`EMPTY_UPDATE`|変更する項目を入力してください。|

Message placeholderはserverで安全な数値・単位だけを埋める。User inputをmessageへ連結しない。

---

## 14. Errorの優先順位

複数の問題が同時にある場合、次の順で処理する。

1. Request body sizeなどserverがbodyを読む前の制限
2. Content-Type
3. JSON parseとroot型
4. path・query形式
5. 認証確認。ただしAUTH-01を除く
6. Origin・CSRF検証
7. body field validation
8. 対象存在・論理削除
9. 現在状態を使う業務rule
10. transaction・永続化

保護対象APIでは、未認証者へfield・resource存在情報を返さないため、認証をbodyの詳細validationより先に行う。JSON parse前に認証するかはframework構造に合わせるが、未認証responseへvalidation detailを含めない。

予期しないerrorを既知のvalidation errorとして握りつぶさない。Error mappingは許可list方式とし、未知の例外は`INTERNAL_ERROR`へ変換する。

---

## 15. 画面での表示と状態

|Error種別|表示場所|入力保持|Focus・次操作|
|---|---|---|---|
|Field validation|field直下＋form上部summary|正常fieldを含め保持|最初のerror fieldへfocus|
|Form全体・業務error|form上部Alert|保持|Alertへfocusし、必要なfield・操作を案内|
|通信error|form上部または画面Alert|保持|再試行buttonを提供|
|401 session失効|共通Alert後SCR-01|Passwordや保護dataを破棄|Loginへfocus|
|404 detail・edit対象なし|画面Alert|対象formは破棄|対応する一覧へ戻る導線|
|409関連Jobあり|UI-04|画面状態を維持|SCR-09で状態「終了」へ変更する導線|
|409同一status|UI-01付近|現在表示を維持|別statusを選択可能にする|
|429 Login|SCR-01 form上部|Email保持、Password clear|`Retry-After`まで送信を無効化|
|500|画面・form Alert|可能な範囲で保持|安全にretryできる場合だけ再試行|

- Errorを色だけで表さず、textとsemanticな関連を持たせる
- Fieldへ`aria-invalid`と`aria-describedby`を設定する
- Error summaryからfieldへ移動できる構成を検討する
- 保存中は重複submitを防ぎ、失敗後はbuttonを再度利用可能にする
- 成功messageとerror messageを同時表示しない
- Client側のnetwork failureにはserverのapplication codeがないため、Client内部状態`NETWORK_ERROR`として「通信できませんでした。接続を確認してもう一度お試しください。」を表示する

Mobileでも同じAPI codeとmessageを使用する。Mobileで利用不可の登録・編集・削除はvalidation errorではなく、そもそも操作UIを提供しない。

---

## 16. Logと機密情報

### 16.1 Server log候補

- timestamp
- environment
- routeまたはAPI ID
- HTTP method
- result status
- application error code
- duration
- server生成request IDを実装する場合のID
- 認証済みUser IDの必要最小限な内部参照

### 16.2 Log・responseへ記録しないもの

- PasswordとPassword hash
- Session token、Cookieおよびsecret
- Authorization相当header
- Request body全体
- AgentCompanyのcontactDetails
- JobのrequiredConditions、preferredConditionsおよび自由記述全文
- SQL、stack traceおよびDB接続情報をclient responseへ出さない

Unexpected errorのstack traceはserver側のdevelopment logでのみ確認できる。Productionでは利用者responseと構造化logを分離し、secretをredactする。

---

## 17. Zod schema構成案

```text
src/shared/validation/
  primitives.ts           # UUID、date、pagination、normalized string
  agent-company.ts        # AgentCompany field・create・update schema
  job.ts                  # Job field・create・update・form schema
  application-status.ts   # status update schema
  auth.ts                 # Login schema
  errors.ts               # Zod issueからfieldErrorsへの変換
```

- Zod 4のschemaを使用し、error customizationは統一された`error` parameterまたは共通error mapperへ集約する
- JSON objectはstrict schemaとする
- JSON APIでは`z.coerce`でstringをnumberへ暗黙変換しない
- FormDataまたはinput stringは専用adapterで変換してから共有domain schemaへ渡す
- Optional stringの空文字からNULLへの変換をfieldごとにばらばらに書かない
- `safeParse`のresultをRoute Handlerで共通error envelopeへ変換する
- AgentCompany存在、論理削除、同一statusなどasync DB ruleをZod refinementへ埋め込まずApplication Serviceへ置く
- Zodの内部issue codeをそのまま公開せず、本書の安定したfield error codeへ変換する

Schema名候補：

|用途|名前|
|---|---|
|AUTH-01|`loginRequestSchema`|
|AC-01|`listAgentCompaniesQuerySchema`|
|AC-03|`createAgentCompanyRequestSchema`|
|AC-04|`updateAgentCompanyRequestSchema`|
|JOB-01|`listJobsQuerySchema`|
|JOB-03|`createJobRequestSchema`|
|JOB-04|`updateJobRequestSchema`|
|APP-02|`updateApplicationStatusRequestSchema`|
|Form|`loginFormSchema`、`agentCompanyFormSchema`、`jobFormSchema`|

---

## 18. API・画面・schema・主なerrorの対応

|API|画面|Input schema|主なerror code|
|---|---|---|---|
|AUTH-01|SCR-01|`loginRequestSchema`|`VALIDATION_ERROR`、`INVALID_CREDENTIALS`、`RATE_LIMITED`|
|AUTH-02|UI-05|bodyなし|`AUTHENTICATION_REQUIRED`、`INTERNAL_ERROR`|
|AC-01|SCR-04・05・06|`listAgentCompaniesQuerySchema`|`INVALID_QUERY_PARAMETER`|
|AC-02|SCR-07・09|`agentCompanyIdPathSchema`|`INVALID_PATH_PARAMETER`、`AGENT_COMPANY_NOT_FOUND`|
|AC-03|SCR-08|`createAgentCompanyRequestSchema`|`VALIDATION_ERROR`|
|AC-04|SCR-09|path＋`updateAgentCompanyRequestSchema`|`AGENT_COMPANY_NOT_FOUND`、`VALIDATION_ERROR`|
|AC-05|SCR-07、UI-03・04|`agentCompanyIdPathSchema`|`AGENT_COMPANY_NOT_FOUND`、`AGENT_COMPANY_HAS_JOBS`|
|JOB-01|SCR-02|`listJobsQuerySchema`|`INVALID_QUERY_PARAMETER`|
|JOB-02|SCR-03・05|`jobIdPathSchema`|`JOB_NOT_FOUND`|
|JOB-03|SCR-04|`createJobRequestSchema`|`VALIDATION_ERROR`、`AGENT_COMPANY_NOT_FOUND`|
|JOB-04|SCR-05|path＋`updateJobRequestSchema`|`JOB_NOT_FOUND`、`AGENT_COMPANY_NOT_FOUND`、`VALIDATION_ERROR`|
|JOB-05|SCR-03、UI-02|`jobIdPathSchema`|`JOB_NOT_FOUND`|
|APP-01|SCR-02・03|`jobIdPathSchema`|`JOB_NOT_FOUND`、`APPLICATION_NOT_FOUND`|
|APP-02|SCR-02・03、UI-01|path＋`updateApplicationStatusRequestSchema`|`VALIDATION_ERROR`、`APPLICATION_STATUS_UNCHANGED`|

---

## 19. Test方針

### 19.1 Unit test

- 各fieldの境界値：0、1、最大値、最大値＋1
- NFC正規化とtrim後の長さ
- single-line fieldの改行拒否
- optional空文字・NULL・未指定の変換
- PATCHで未指定が変更なし、NULLがclearとなる
- PATCH空objectが`EMPTY_UPDATE`となる
- Unknown fieldが拒否される
- UUID、date、enum、paginationの正常・異常
- 万円文字列を円integerへ正確に変換し、浮動小数点丸めを行わない
- 稼働率0、100、小数2桁と範囲外・小数3桁
- Array上限、item上限、正規化後重複、空item
- 単価片側だけ、両方なし、正常range、逆range
- Zod issueからfield error code・path・messageへの安定変換

### 19.2 Integration test

- Content-Type、空body、不正JSON、root型、64 KiB上限
- 保護対象APIが未認証時にvalidation detailを返さない
- Path・query・body errorが決定したHTTP statusとenvelopeを返す
- AgentCompany名の重複登録が成功する
- 削除済みAgentCompanyをJobへ指定すると404になる
- Related JobがあるAgentCompany削除が409になる
- JobとApplicationがvalidation成功時だけ同時作成される
- 同一statusが409となり、Application・時刻・Historyが不変である
- 別statusでApplicationとHistoryが同時更新される
- DB constraint errorをSQL detailなしのapplication errorへ変換する
- Better Auth内部errorを`INVALID_CREDENTIALS`へ統一する
- Rate limitで429と`Retry-After`を返す

### 19.3 Component・E2E test

- Field errorが対象fieldに関連付けられ、最初のerrorへfocusする
- 正常な入力値をvalidation error後も保持する
- Login失敗後にEmailだけを保持しPasswordをclearする
- 送信中の重複submitを防ぎ、失敗後に再送信できる
- Server field errorをform field名へmappingする
- Session失効時に保護dataを表示せずSCR-01へ移動する
- 404時に対応一覧へ戻れる
- 409関連JobありでUI-04を表示する
- Mobileのstatus更新でdesktopと同じvalidation・error契約を使用する

---

## 20. 採用案と代表的な代替案

|論点|採用案|代表的な代替案|違い|
|---|---|---|---|
|Unknown field|拒否|無視|拒否はtypoと古いclientを早期検知できる。無視は前方互換性が高い|
|Optional空文字|NULLへ正規化|空文字を保存|NULL統一で未入力queryが単純になる。空文字との差を製品が必要とする場合は不向き|
|PATCH|未指定は維持、NULLはclear|全field必須、JSON Merge Patch|採用案はform差分を扱いやすく、既存PATCH方針に合う|
|文字数|Unicode code point|UTF-8 byte、UTF-16 code unit、grapheme cluster|環境間で実装しやすく、日本語1文字を通常1として扱える|
|単価API|円integer|万円Decimal、decimal string|単位がfield名で明確で、DBと同じ値を返せる|
|Pagination|default 20、max 100|全件、cursor|100件規模で単純。cursorは大量・頻繁更新data向け|
|Error形式|既存のcode＋message＋fieldErrors|RFC 9457 Problem Details、messageだけ|既存DESIGN-04と一致し、form errorを直接扱える|
|Field error|fieldごとに最初の1件|全issue、最初の全体1件|修正可能な情報を過不足なく表示し、responseを安定させる|
|Business validation|Application Service|Zod async refine、DB errorだけ|HTTPから分離してtransactionとtestへ再利用できる|
|Login error|汎用message|Emailなし・Password不正を区別|汎用messageはUser存在情報を公開しない|

---

## 21. PMレビュー対象となるDeveloper案

既存資料だけでは具体値を確定できないため、本PRで次をレビューする。

1. JSON bodyを64 KiBまでとし、超過を`413`とする
2. Unknown body fieldとquery parameterを無視せず拒否する
3. Business stringをNFC・trimし、Unicode code point数で最大長を判定する
4. Optional stringの空文字・`null`をDBのNULLへ統一する
5. PATCHの未指定を変更なし、`null`・空文字を任意fieldのclearとし、空更新を拒否する
6. 一覧をdefault 20件、最大100件とする
7. Login Emailをtrim・NFC・ASCII小文字化し、最大254、Passwordを8〜128とする
8. AgentCompany各fieldを本書の最大長とし、最終連絡日の未来日を拒否する
9. Job各fieldを本書の最大長・配列上限とする
10. 単価formを0〜10,000万円・小数2桁、API・DBを0〜100,000,000円・100円単位integerとする
11. 稼働率を0〜100・小数2桁のpercentとする
12. 都道府県を47日本語名称から選択し、海外・不明は補足へ記載する
13. 共通error envelope、HTTP status、application code、field codeおよび日本語messageを本書どおりとする
14. Validation errorはfieldごとの最初の1件をschema順で返す
15. Form error、session失効、404、409、429およびnetwork errorの画面表示・入力保持方針を本書どおりとする

承認後は、同じruleをZod schema、form、Application Service、DB constraintおよびtestへ実装する。値を変更する場合は本書、API契約、Migrationおよびtest fixtureへの影響を同時に確認する。

---

## 22. 後続実装で決定・確認する内容

- Zod 4の固定versionと共通helperの実装API
- Form libraryを使用するか、React標準form stateを使用するか
- Body sizeをNext.js・hostingのどの層で強制するか
- Better Auth errorと本書codeの完全なmapping table
- Email normalizationの固定Better Auth versionとの一致
- Decimal値をPrismaへ渡しresponseへ直列化する方法
- DB error codeとdomain errorの安全なmapping
- Request IDをerror responseへ追加するか
- Deadlock・serialization retryの回数とbackoff
- Error summary・focusのComponent実装
- OpenAPIまたはJSON Schemaを生成する時期
- APP-01を独立endpointとして実装するかJOB-01・02へ統合するか

これらは本書の製品上の入力可否とerror意味を変更しない範囲で実装Issueにて決定する。変更する必要が生じた場合は設計へ戻す。

---

## 23. 公式資料

- [Zod 4 API](https://zod.dev/api)
- [Zod 4 Migration Guide](https://zod.dev/v4/changelog)
- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
- [Next.js Backend for Frontend](https://nextjs.org/docs/app/guides/backend-for-frontend)
- [Better Auth Email and Password](https://better-auth.com/docs/authentication/email-password)
- [Better Auth API](https://better-auth.com/docs/concepts/api)
- [Better Auth Rate Limit](https://better-auth.com/docs/concepts/rate-limit)
- [HTTP Semantics RFC 9110](https://www.rfc-editor.org/rfc/rfc9110)
- [HTTP Problem Details RFC 9457](https://www.rfc-editor.org/rfc/rfc9457)

---

## 24. 関連資料

- [Agent Job Tracker 要求定義書](../requirements/revised-product-requirements.md)
- [Sprint 1 ユースケース・ユーザーフロー](sprint1-user-flows.md)
- [Sprint 1 画面一覧](sprint1-screen-list.md)
- [Sprint 1 画面遷移](sprint1-screen-transitions.md)
- [Sprint 1 ワイヤーフレーム](sprint1-wireframes.md)
- [Sprint 1 API一覧・入出力概要](sprint1-api-overview.md)
- [Sprint 1 論理データモデル](sprint1-data-model.md)
- [Sprint 1 技術構成・選定理由](sprint1-technical-architecture.md)
- [Sprint 1 認証方式・セッション設計](sprint1-authentication-design.md)
- [Sprint 1 物理データモデル](sprint1-physical-data-model.md)
