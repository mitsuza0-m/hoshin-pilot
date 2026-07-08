// ══════════════════════════════════════════════
// HoshinReports — 日報データの単一情報源
// これまで 02 / 05 / 09 / 11 番のページがそれぞれ別々にハードコードしていた
// 「田中一郎の8/9の日報」のような内容を、ここに1つだけ持たせる。
// コメントの送信状態、および06/10から新規送信された日報は HoshinStore（localStorage）
// に保存され、同じブラウザで開いた他のページにも反映される。
// ══════════════════════════════════════════════
const HoshinReports = (function () {
  const STORE_KEY = 'reportOverrides'; // { [reportId]: { commented, comment } }
  const CREATED_KEY = 'reportsCreated'; // [ report, ... ]（06/10から新規送信された日報）

  // 日付順（古い→新しい）。date は表示用、sortKey は並び替え用。
  const BASE = [
    {
      id: 'tanaka_20240805', memberId: 'tanaka', date: '2024年8月5日（月）', dateLabel: '8月5日（月）', sortKey: 20240805,
      tag: 'お客様第一 / 挑戦を楽しむ', ai: 'match',
      body: '新しい提案フォーマットを試験導入。お客様からの反応が良く、次回以降も継続する方針にした。',
      commented: true, comment: '新しい形に挑戦する姿勢が素晴らしいです。反応が良かった理由をチームにも共有してもらえますか？'
    },
    {
      id: 'tanaka_20240807', memberId: 'tanaka', date: '2024年8月7日（水）', dateLabel: '8月7日（水）', sortKey: 20240807,
      tag: 'お客様第一', ai: 'check',
      body: 'D社への訪問準備。提案書の最終確認と見積もりの調整を行った。価格面での懸念があったため、価値訴求の資料を追加した。',
      commented: false, comment: ''
    },
    {
      id: 'tanaka_20240808', memberId: 'tanaka', date: '2024年8月8日（木）', dateLabel: '8月8日（木）', sortKey: 20240808,
      tag: '改善を続ける', ai: 'match',
      body: '既存顧客への定期フォローを実施。前回の指摘事項が改善されているか確認し、追加要望をヒアリングした。',
      commented: true, comment: '地道なフォローがお客様との信頼を作っています。引き続きお願いします。'
    },
    {
      id: 'tanaka_20240809', memberId: 'tanaka', date: '2024年8月9日（金）', dateLabel: '今日', sortKey: 20240809,
      tag: 'お客様第一 / 改善を続ける', ai: 'match',
      body: '新規顧客のB社を初訪問。先方の経営課題を3点ヒアリングし、次回提案のアジェンダを作成した。顧客の言葉をそのままメモすることを意識した。',
      learning: '顧客との対話の中で「聞く」ことの重要性を再確認した。質問の仕方を工夫するだけで、情報量が大きく変わることを実感した。',
      hint: '<strong>AIより：</strong>「お客様第一」「改善を続ける」両方の指針に沿った素晴らしい日報です。チームへの横展開を検討してみましょう。',
      commented: true, comment: '顧客の言葉をそのまま拾う姿勢、とても良いです。次回提案も期待しています。'
    },

    {
      id: 'suzuki_20240806', memberId: 'suzuki', date: '2024年8月6日（火）', dateLabel: '8月6日（火）', sortKey: 20240806,
      tag: 'チームで助け合う', ai: 'check',
      body: '新機能のテストを完了。バグ3件を発見し報告、うち2件は即日修正した。残る1件は来週対応予定。',
      commented: false, comment: ''
    },
    {
      id: 'suzuki_20240808', memberId: 'suzuki', date: '2024年8月8日（木）', dateLabel: '8月8日（木）', sortKey: 20240808,
      tag: 'チームで助け合う / 改善を続ける', ai: 'match',
      body: 'リリース後の不具合報告を受け、優先度を整理して修正計画を立てた。メンバーへの負荷が偏らないよう調整した。',
      commented: true, comment: 'チーム全体を見て調整できるのは大きな強みです。ありがとう。'
    },
    {
      id: 'suzuki_20240809', memberId: 'suzuki', date: '2024年8月9日（金）', dateLabel: '今日', sortKey: 20240809,
      tag: 'チームで助け合う', ai: 'check',
      body: 'スプリントレビューを実施。チーム間の認識のズレを解消し、次回改善点を合意した。会議のファシリテーションを担当し、全員が発言できる場を作った。',
      learning: 'ファシリテーターとして「全員の声を引き出す」ことの難しさを実感した。次回は事前にアジェンダを共有することで改善できると思う。',
      hint: '<strong>AIより：</strong>「チームで助け合う」の指針を体現した日報です。ファシリテーションへの挑戦も「挑戦を楽しむ」指針に繋がっています。',
      commented: false, comment: ''
    },

    {
      id: 'yamamoto_20240807', memberId: 'yamamoto', date: '2024年8月7日（水）', dateLabel: '8月7日（水）', sortKey: 20240807,
      tag: 'お客様第一', ai: 'check',
      body: '見積り修正の依頼に対応。価格よりも導入後のサポート体制について質問が多かったため、資料を追加で準備した。',
      commented: false, comment: ''
    },
    {
      id: 'yamamoto_20240809', memberId: 'yamamoto', date: '2024年8月9日（金）', dateLabel: '今日', sortKey: 20240809,
      tag: 'お客様第一', ai: 'need',
      body: '午前中に既存顧客のA社を訪問。先月の提案に対するフィードバックをいただき、修正点を整理した。午後は提案書の改訂作業を行い、来週月曜日の再提案に向けて準備を進めた。',
      learning: 'お客様は「価格」より「使いやすさ」を重視していることがわかった。次回は機能説明より操作イメージを見せることが大事だと感じた。',
      hint: '<strong>AIより：</strong>「お客様第一」の指針に沿った行動です。ただし今月「挑戦を楽しむ」指針への言及が0件です。このコメントでその点を励ましてみましょう。',
      commented: false, comment: ''
    },

    {
      // 佐藤は「3日間未提出」という設定のため、最終提出は8/6（8/7〜8/9は未提出）
      id: 'sato_20240806', memberId: 'sato', date: '2024年8月6日（火）', dateLabel: '8月6日（火）', sortKey: 20240806,
      tag: '誠実に行動する', ai: 'match',
      body: '請求書発行の締め作業。金額の再確認を二重に行い、ミスがないよう慎重に進めた。',
      commented: true, comment: '数字への丁寧さがチームの信頼につながっています。'
    },

    {
      id: 'yamada_20240806', memberId: 'yamada', date: '2024年8月6日（火）', dateLabel: '8月6日（火）', sortKey: 20240806,
      tag: 'お客様第一', ai: 'match',
      body: 'D社初訪問。課題を3点ヒアリングし、提案の方向性が固まった。顧客の話し方から信頼関係を築く大切さを感じた。',
      learning: '初回訪問では「売る」より「聞く」に集中することで、顧客が本音を話してくれることを体感した。',
      commented: false, comment: ''
    },
    {
      id: 'yamada_20240807', memberId: 'yamada', date: '2024年8月7日（水）', dateLabel: '8月7日（水）', sortKey: 20240807,
      tag: 'チームで助け合う', ai: 'check',
      body: '後輩の資料作成をサポート。自分の業務が少し後回しになったが、チームとして助け合えた。',
      learning: '自分のタスクと周囲のサポートのバランスを考えることが大切だと感じた。',
      commented: false, comment: ''
    },
    {
      id: 'yamada_20240808', memberId: 'yamada', date: '2024年8月8日（木）', dateLabel: '8月8日（木）', sortKey: 20240808,
      tag: 'お客様第一 / 改善を続ける', ai: 'match',
      body: 'A社の定例で「価格より使いやすさ重視」というフィードバックをいただいた。午後は提案書を修正し、来週の再提案に備えた。',
      learning: '顧客は「価格」より「使いやすさ」を重視していることがわかった。次回は操作デモを見せることが大事だと感じた。',
      commented: true, comment: '顧客の言葉をそのままメモするのは素晴らしい姿勢です。次回提案でその視点を活かしてください！'
    }
  ];

  // AI判定の表示ラベル・色（ai-chip の見た目はページごとのCSSに依存するため、種別だけ持つ）
  const AI_LABELS = {
    match: { label: '✓ 指針と合っています', kind: 'match' },
    check: { label: '要確認', kind: 'check' },
    need:  { label: '✦ 確認が必要', kind: 'check' }
  };

  function overrides() {
    return HoshinStore.get(STORE_KEY, {});
  }

  function created() {
    return HoshinStore.get(CREATED_KEY, []);
  }

  function allReports() {
    return BASE.concat(created());
  }

  // 日報一覧を返す。memberIds を渡すと、そのメンバーのものだけに絞る。
  function list(memberIds) {
    const ov = overrides();
    const rows = allReports()
      .filter(r => !memberIds || memberIds.indexOf(r.memberId) !== -1)
      .map(r => {
        const o = ov[r.id];
        return o ? Object.assign({}, r, o) : Object.assign({}, r);
      });
    rows.sort((a, b) => b.sortKey - a.sortKey);
    return rows;
  }

  function get(id) {
    const ov = overrides();
    const base = allReports().find(r => r.id === id);
    if (!base) return null;
    return ov[id] ? Object.assign({}, base, ov[id]) : Object.assign({}, base);
  }

  // 06/10の日報フォームから新規日報を追加する。同じidが既にあれば何もしない（二重送信防止）。
  function add(report) {
    if (get(report.id)) return get(report.id);
    const rows = created();
    const entry = Object.assign({ commented: false, comment: '' }, report);
    rows.push(entry);
    HoshinStore.set(CREATED_KEY, rows);
    return entry;
  }

  function aiLabel(kind) {
    return AI_LABELS[kind] || AI_LABELS.check;
  }

  // 指定メンバーの最新日報（未提出アラートの「最終提出日」表示に使う）
  function latestFor(memberId) {
    const rows = list([memberId]);
    return rows.length ? rows[0] : null;
  }

  // コメントを送信し、全ページで共有される状態として保存する
  function sendComment(id, commentText) {
    const ov = overrides();
    ov[id] = { commented: true, comment: commentText };
    HoshinStore.set(STORE_KEY, ov);
  }

  function uncommentedCount(memberIds) {
    return list(memberIds).filter(r => !r.commented).length;
  }

  // ── 指針の浸透度をタグ集計で算出 ──
  // 提出済み日報の指針タグ（"A / B" 形式）を集計し、指針ごとの浸透度を返す。
  // pct = その指針に言及した日報数 / 対象日報の総数（％）。
  // memberIds を渡すとその人のみ（null なら全社員）。降順で返す。
  function tagPenetration(memberIds) {
    const rows = list(memberIds);
    const total = rows.length;
    const counts = {};
    rows.forEach(r => {
      (r.tag || '').split('/').map(s => s.trim()).filter(Boolean).forEach(t => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.keys(counts).map(t => ({
      tag: t,
      count: counts[t],
      total: total,
      pct: total ? Math.round(counts[t] / total * 100) : 0
    })).sort((a, b) => b.pct - a.pct);
  }

  return { list, get, add, aiLabel, sendComment, uncommentedCount, latestFor, tagPenetration };
})();
