import type { Dictionary } from "./en";

export const ja: Dictionary = {
  "lang.name.en": "English",
  "lang.name.vi": "Tiếng Việt",
  "lang.name.ja": "日本語",
  "lang.switch": "言語を変更",

  "nav.shop": "ショップ",
  "nav.cart": "カート",
  "nav.chaos": "Chaos Panel",
  "nav.theme.toLight": "ライトテーマに切り替える",
  "nav.theme.toDark": "ダークテーマに切り替える",
  "footer.tagline":
    "QuickCart は、10 個の本番バグをわざと仕込んだデモ用ストアフロントです。ここで起きる障害はすべて本物で、CloudWatch Logs から Cowork Local へそのまま流れていきます。",

  "home.eyebrow": "デモストアフロント",
  "home.title": "ここにあるものは全部動きます。それが問題なのです。",
  "home.subtitle":
    "普通に買い物をするだけで、本物の本番バグに出会えます。在庫を超えた販売、二重課金、クーポンを入力した順序で変わる価格。どれも実際のバックエンドのコードによるもので、発生した障害はすべて Cowork Local に送られます。",
  "home.reload": "カタログを再読み込み",
  "home.reloading": "カタログを読み込み中…",
  "home.lastLoad": "前回の読み込み {ms}ms · Scan 1 回 + 評価の取得 {count} 回",
  "home.loadFailed": "カタログの読み込みに失敗しました: {error}",
  "home.oversoldTitle": "在庫がマイナスになっています",
  "home.oversoldBody": "対象は {names} です — これがバグ #1、ゼロを超えて売れてしまう問題です。",
  "home.badge.oversold": "{stock} 超過販売",
  "home.badge.soldOut": "売り切れ",
  "home.badge.onlyLeft": "残り {stock} 点",
  "home.inStock": "在庫 {stock} 点",
  "home.addToCart": "カートに追加",
  "home.added": "追加しました ✓",
  "home.empty": "まだ商品がありません。{command} を実行してカタログを投入してください。",

  "cart.title": "カートの中身",
  "cart.empty": "まだ何もありません。",
  "cart.summary": "{count} 明細 · 共有カートレコードと同期済み",
  "cart.reload": "サーバーから再読み込み",
  "cart.emptyBody": "カートは空です。",
  "cart.browse": "ショップを見る",
  "cart.each": "単価 ${price}",
  "cart.remove": "削除",
  "cart.quantityFor": "{name} の数量",
  "cart.subtotal": "小計",
  "cart.checkout": "チェックアウトに進む",
  "cart.hint":
    "数量は単純な last-write-wins の更新で保存されます。このページを 2 つのタブで開いて両方の数値を変更してみてください。片方は何の通知もないまま消えます。",
  "cart.sync.saving": "共有カートレコードに保存中…",
  "cart.sync.saved": "{time} に保存しました",
  "cart.sync.inSync": "同期済み",
  "cart.sync.error": "カートのバックエンドに接続できません — ローカルのみ",
  "cart.serverHolds": "サーバーは 1 行目の数量として {qty} を保持しています",
  "cart.peer.title": "2 つ目のタブ — 同じカート",
  "cart.peer.body":
    "このタブは共有カートレコードに数量 {qty} を書き込みました。もう一方のタブは同じ瞬間に別の数値を書き込んでいます。最後に届いたほうが勝ち、もう一方の変更は競合エラーも出ないまま消えます。",
  "cart.peer.saving": "保存中…",
  "cart.peer.saved": "{time} に保存しました",
  "cart.peer.waiting": "カートの読み込みを待っています…",

  "checkout.title": "チェックアウト",
  "checkout.session": "セッション",
  "checkout.tokenExpired": "· トークンの有効期限切れ",
  "checkout.summary": "注文内容",
  "checkout.totalShown": "画面に表示されている合計",
  "checkout.coupon": "クーポンコード",
  "checkout.couponPlaceholder": "SAVE10, FLAT5 — 両方をカンマ区切りで指定することもできます",
  "checkout.couponHint": "コードは左から順に適用されます。{a} と {b} は同じ金額になりません。",
  "checkout.express": "Express shipping",
  "checkout.expressHint":
    "チェックアウト時に配送業者のリアルタイム見積もりを取得します。この呼び出しには最大 8 秒かかることがあります。",
  "checkout.youPay": "お支払い金額",
  "checkout.placeOrder": "Place order",
  "checkout.placing": "注文を送信中… (実行中 {count} 件)",
  "checkout.expireSession": "アイドルタイムアウトをシミュレートする (セッションを失効させる)",
  "checkout.sessionStale": "セッションが古くなっています",
  "checkout.emptyBody": "チェックアウトするものがありません — カートは空です。",
  "checkout.result.confirmed": "注文が確定しました",
  "checkout.result.multi": "{total} 件のリクエストのうち {ok} 件が注文を作成しました",
  "checkout.result.failed": "チェックアウトに失敗しました",
  "checkout.result.charged": "サーバーの請求額",
  "checkout.result.drift": "画面の表示は ${shown} — {cents} セントのずれ",
  "checkout.result.order": "注文 {id}",
  "checkout.result.duplicate": "どちらも idempotency key {key}… を送っていました — 二重課金です。",
  "checkout.footnote":
    "このページで起きる障害はすべて実際のバックエンドの挙動であり、CloudWatch 経由で Cowork Local に転送されます。",

  "chaos.eyebrow": "Chaos panel",
  "chaos.title": "10 個のバグを、好きなときに",
  "chaos.intro.a": "Run in UI",
  "chaos.intro.b":
    "はブラウザを自動操縦に渡します。本物のストアフロントを歩き回り、本物のボタンをクリックし、本物の入力欄に文字を打ち込んで、目の前でバグを起こします。",
  "chaos.intro.c": "Trigger",
  "chaos.intro.d": "は画面を飛ばして Lambda を直接呼び出します。速いですが、見どころはありません。",
  "chaos.driving": "自動操縦が実行中です — 隅のパネルをご覧ください。",
  "chaos.runInUI": "Run in UI",
  "chaos.running": "実行中…",
  "chaos.trigger": "Trigger",
  "chaos.onScreen": "画面上の動き:",
  "chaos.restock": "在庫を補充する",
  "chaos.restocking": "補充しています…",
  "chaos.restocked": "{count} 件の商品を補充しました。ショップを再読み込みしてご確認ください。",
  "chaos.restockFailed": "補充できませんでした: {error}",
  "chaos.restockHint":
    "実行するたびに在庫が減り、マイナスになることもあります。デモの合間にこれを使って、販売可能な状態に戻してください。",
  "chaos.pipeline.title": "障害が Cowork Local に届くまで",
  "chaos.pipeline.body":
    "Lambda がエラーをログに出力 → CloudWatch Logs のサブスクリプションフィルターがその行にマッチしてイベント自体を送出 → log-forwarder Lambda が Bugs Hunter の Webhook に POST します。実際のメッセージとスタックトレースを伴って数秒以内に届き、発生 1 回につき 1 通が配信されます。",

  "hud.title": "カオス自動操縦",
  "hud.finished": "実行が完了しました",
  "hud.starting": "開始しています…",
  "hud.hide": "隠す",
  "hud.show": "表示",
  "hud.stop": "停止",
  "hud.close": "閉じる",
  "hud.driving": "#{num} — {title} のために実際の UI を操作しています。",
  "hud.stopped": "実行を停止しました。",

  "step.openShop": "ストアフロントを開く",
  "step.openCart": "カートを開く",
  "step.checkout": "チェックアウトに進む",
  "step.addFirst": "最初の商品をカートに追加する",
  "step.rebuildCart": "同じカートを組み立て直す",
  "step.goto": "{path} へ移動する",

  "bug1.title": "最後の在庫を超過販売する",
  "bug1.what":
    "条件付き書き込みを使わずに在庫を減算しているため、同じ最後の在庫に対する 2 つのチェックアウトが両方とも通ってしまいます。",
  "bug1.screen":
    "商品を追加し、数量を残りの在庫すべてに設定してから Place order をダブルクリックして、2 つのチェックアウトを競合させます。",
  "bug1.stockNote": "「{name}」の残りは {stock} 点です。",
  "bug1.add": "カートに追加する",
  "bug1.setQty": "数量を残り {stock} 点すべてに設定する",
  "bug1.doubleClick": "Place order をダブルクリック — 2 つのチェックアウトが競合します",
  "bug1.both":
    "「{name}」の全 {stock} 点に対する同時チェックアウトが両方とも成功しました — 在庫はマイナスになり得ます。カタログを再読み込みして確認してください。",
  "bug1.partial":
    "{ok}/2 件のチェックアウトが成功しました。在庫がもっと多い商品で再実行するか、カタログでマイナスの在庫数を探してみてください。",

  "bug2.title": "ダブルクリックによる注文の重複",
  "bug2.what":
    "idempotency key は送信されているものの、サーバー側でまったく検証されていないため、待ちきれずにダブルクリックすると 2 回課金されます。",
  "bug2.screen":
    "商品を 1 つカートに入れて Place order をダブルクリックします。ページはボタンを無効化しないので、同じキーのまま 2 つのリクエストが送信されます。",
  "bug2.keyNote": "チェックアウトはこのカートに idempotency key {key}… を保持しています。",
  "bug2.doubleClick": "Place order をダブルクリック",
  "bug2.both":
    "2 つのリクエストは同じ idempotency key を持ち、どちらも注文を作成しました — これが二重課金です。",
  "bug2.partial":
    "{ok}/2 件のリクエストが成功しました — 2 件目は重複チェックで拒否されたわけではなく、単に競合に負けただけです。",

  "bug3.title": "監査ログが黙って失敗する (IAM)",
  "bug3.what":
    "チェックアウトのロールに監査バケットへの s3:PutObject 権限がないため、顧客には成功と表示されたまま、すべての注文で監査証跡が失われます。",
  "bug3.screen":
    "ごく普通に商品を 1 つ購入します。画面上では注文が確定し、失敗は CloudWatch でしか見えません。",
  "bug3.place": "ごく普通の注文を 1 件出す",
  "bug3.ok":
    "画面上では注文が確定しました。s3:PutObject の AccessDenied はサーバー側で発生しており、監査レコードが欠けていることを顧客が知ることはありません。",
  "bug3.failed": "監査書き込みに到達する前にチェックアウトが失敗しました — 結果パネルを確認してください。",

  "bug4.title": "タブ間でカートの更新が失われる",
  "bug4.what":
    "カートは単純な last-write-wins の更新で保存されるため、一方のタブがもう一方の変更を黙って上書きします。",
  "bug4.screen":
    "カートを 2 つ目のブラウザタブで開きます。両方のタブが同じ瞬間に数量を変更し、生き残るのは片方だけです。",
  "bug4.openTab": "同じカートを 2 つ目のタブで開く",
  "bug4.blocked": "ブラウザが 2 つ目のタブをブロックしました。このサイトのポップアップを許可してから再実行してください。",
  "bug4.opened": "2 つ目のタブを開きました — このタブはサーバーに数量 9 を書き込みます。",
  "bug4.setQty": "このタブは同じタイミングで数量を 2 に設定します",
  "bug4.reread": "サーバーからカートを読み直す",
  "bug4.reload": "サーバーからカートを再読み込みする",
  "bug4.result":
    "2 つのタブが同じ 1 秒のうちに 9 と 2 を書き込み、サーバーには {qty} が残りました。もう一方のタブの変更は競合エラーも出ないまま消えています。",

  "bug5.title": "クーポンの計算が順序に依存する",
  "bug5.what":
    "SAVE10 (10% 割引) と FLAT5 (−$5) が別々の if で適用されるため、並べる順序によって価格が変わってしまいます。",
  "bug5.screen":
    "同じカートを 2 回チェックアウトし (1 回目は SAVE10,FLAT5、2 回目は FLAT5,SAVE10)、合計額を比較します。",
  "bug5.setQty": "数量を 3 に設定する",
  "bug5.setQtyAgain": "もう一度数量を 3 に設定する",
  "bug5.enterA": "クーポン「SAVE10,FLAT5」を入力する",
  "bug5.enterB": "同じクーポンを逆の順序で入力する",
  "bug5.place": "注文する",
  "bug5.noteA": "SAVE10 → FLAT5 の順: {total}",
  "bug5.noteB": "FLAT5 → SAVE10 の順: {total}",
  "bug5.differ":
    "同じカート、同じ 2 つのクーポンなのに価格が違います: {a} と {b} — 文字列の順序だけで {diff} の差が生まれました。",
  "bug5.same": "合計は {a} と {b} でした。上の結果パネルを確認してください。",

  "bug6.title": "浮動小数点の丸め誤差",
  "bug6.what":
    "明細の合計を生の JS の float のまま累算し、セント単位に丸めていないため、画面に表示された金額の合計と総額がずれていきます。",
  "bug6.screen":
    "カートを大量の商品で埋めてから、ページが表示する合計とサーバーが請求する合計を比較します。",
  "bug6.fill": "カートを多数の明細で埋める",
  "bug6.addNth": "商品 {n} を追加 ({round}/3 巡目)",
  "bug6.basket": "カートは {count} 商品 × 3 巡になりました。",
  "bug6.place": "注文する",
  "bug6.drift": "ページの表示は {shown} でしたが、サーバーの請求は {charged} でした — {cents} セントのずれです。",
  "bug6.noDrift":
    "ページは {shown}、サーバーは {charged} — このカートでは目に見えるずれは出ませんでした。端数のある価格の商品をもっと追加して再実行してください。",
  "bug6.fallback": "注文しました — 結果パネルで 2 つの合計を比べてください。",

  "bug7.title": "マイナスの数量が受け付けられる",
  "bug7.what":
    "数量が一切検証されないため、マイナスの数値はマイナスを引くことになり、チェックアウトが在庫を逆に増やして合計額も狂わせます。",
  "bug7.screen": "カートの数量欄に −2 をそのまま入力してチェックアウトします。何も止めてくれません。",
  "bug7.before": "数量欄は現在 {qty} です。",
  "bug7.setQty": "マイナスの数量を入力する: −2",
  "bug7.place": "そのまま注文する",
  "bug7.ok":
    "数量 −2 が受け付けられ、合計 {total} が返されました。カタログを再読み込みしてください。その商品の在庫が増えています。",
  "bug7.threw":
    "マイナスの数量でチェックアウトが例外を投げました — きれいなバリデーションエラーではなく、ハンドリングされていない 500 です。",

  "bug8.title": "配送見積もりで Lambda が落ちる",
  "bug8.what":
    "配送業者のリアルタイム見積もりは最大 8 秒かかることがあるのに Lambda のタイムアウトは 6 秒で、関数は処理の途中で強制終了され、後始末も行われません。",
  "bug8.screen":
    "チェックアウトで実際に「Express shipping — 配送業者のリアルタイム見積もり」にチェックを入れ、注文してから関数が落ちるまで待ちます。",
  "bug8.tick": "Express shipping (配送業者のリアルタイム見積もり) にチェックを入れる",
  "bug8.place": "注文して配送業者への呼び出しを待ち切る",
  "bug8.survived":
    "今回は見積もりがタイムアウト内に返ってきました — 遅延は最大 8 秒でランダムなので、もう一度実行してください。",
  "bug8.died":
    "Lambda がチェックアウトの途中で強制終了されました。顧客にはただの失敗としか見えず、中途半端な処理がそのまま残されます。",

  "bug9.title": "チェックアウト中にセッションが切れる",
  "bug9.what":
    "有効期限切れのトークンと、そもそもサインインしていない状態が区別されていないため、顧客は一律の Unauthorized で追い返されます。",
  "bug9.screen":
    "チェックアウトの「セッションを失効させる」操作 (実際のアイドルタイムアウトと同じこと) を使ってから、支払いを試みます。",
  "bug9.expire": "セッションを古い状態にする",
  "bug9.place": "古いセッションのまま支払いを試みる",
  "bug9.ok": "古いセッションにもかかわらず、チェックアウトが成功してしまいました。",
  "bug9.failed":
    "一律の Unauthorized が返るだけで、リフレッシュも試みず、「カートは保存されています」という導線もありません — 顧客は作業の続きを失います。",

  "bug10.title": "カタログの裏に潜む N+1 クエリ",
  "bug10.what":
    "カタログの Lambda は全商品を Scan したうえで、評価を取得するために商品ごとに個別の GetItem を実行します。",
  "bug10.screen":
    "ストアフロントをサーバーから数回再読み込みして、ファンアウトが CloudWatch と読み込み時間に現れる様子を確認します。",
  "bug10.reload": "カタログを再読み込み ({i}/3)",
  "bug10.result":
    "{products} 商品、平均ラウンドトリップ {ms}ms — 再読み込み 1 回につき Scan 1 回 + 評価の GetItem が {products} 回発生しています。",

  "headless.noProduct": "商品がまだ読み込まれていません。",
};
