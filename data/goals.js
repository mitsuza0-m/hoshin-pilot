// ══════════════════════════════════════════════
// HoshinGoals — 会社目標（KGI）・チーム目標（KPI）・個人目標の単一情報源
// これまで 03番（指針書エディタ）と 12番（チームの目標）が別々に
// ハードコードして数値がズレる原因になっていたテーブルを、
// ここに1つだけ持たせる。編集内容は HoshinStore（localStorage）に保存され、
// 同じブラウザで開いた他のページにも反映される。
// ══════════════════════════════════════════════
const HoshinGoals = (function () {
  const KGI_KEY = 'goals_kgi';
  const KPI_KEY = 'goals_kpi';
  const PERSONAL_KEY = 'goals_personal';

  const DEFAULT_KGI = [
    { id: 'kgi_sales',   name: '売上 3億円を達成する',      target: '3億',  current: '1.8億', pct: 60, color: 'teal' },
    { id: 'kgi_csat',    name: 'お客様満足度 90点以上',      target: '90点', current: '82点',  pct: 91, color: 'gold' },
    { id: 'kgi_engage',  name: '社員のやりがい度 80%以上',   target: '80%',  current: '64%',   pct: 80, color: 'gold' }
  ];

  // KPIは部署ごとに持つ（営業／開発／管理）。個人目標がメンバーごとに分かれているのと同じ構造。
  const DEFAULT_KPI = {
    sales: [
      { id: 'kpi_deals',   name: '新規商談件数',   linkedKgi: '売上 3億円',   target: '月20件', current: '13件',    freq: '月次', pct: 65, danger: false },
      { id: 'kpi_winrate', name: '受注率',         linkedKgi: '売上 3億円',   target: '40%',    current: '31%',     freq: '月次', pct: 77, danger: false },
      { id: 'kpi_visits',  name: '顧客訪問回数',   linkedKgi: '満足度 90点', target: '週3回',  current: '週1.8回', freq: '週次', pct: 60, danger: true }
    ],
    dev: [
      { id: 'kpi_release',  name: 'リリース予定の遵守率', linkedKgi: '売上 3億円',  target: '95%',   current: '88%',  freq: '月次', pct: 88, danger: false },
      { id: 'kpi_bugs',     name: '重大バグの発生件数',   linkedKgi: '満足度 90点', target: '月0件', current: '月2件', freq: '月次', pct: 50, danger: true },
      { id: 'kpi_autotest', name: 'テスト自動化率',       linkedKgi: '満足度 90点', target: '70%',   current: '52%',  freq: '四半期', pct: 74, danger: false }
    ],
    admin: [
      { id: 'kpi_close',   name: '月次決算の早期化',   linkedKgi: '売上 3億円',   target: '5営業日', current: '8営業日', freq: '月次', pct: 63, danger: false },
      { id: 'kpi_billing', name: '請求処理の正確性',   linkedKgi: '満足度 90点', target: 'エラー0件', current: 'エラー1件', freq: '月次', pct: 80, danger: false },
      { id: 'kpi_cost',    name: '間接コスト削減',     linkedKgi: '売上 3億円',   target: '前年比 −5%', current: '−2%',   freq: '四半期', pct: 40, danger: true }
    ]
  };

  const DEFAULT_PERSONAL = {
    tanaka: [
      { id: 'p_tanaka_1', name: '担当の新規商談数',           linkedKpi: '新規商談件数', target: '月8件',     current: '5件',  freq: '月次', pct: 63, danger: false },
      { id: 'p_tanaka_2', name: '指針体現スコア（AI自動）',   linkedKpi: '指針浸透指標', target: '月平均80pt', current: '92pt', freq: '月次', pct: 100, danger: false }
    ],
    suzuki: [
      { id: 'p_suzuki_1', name: 'スプリントの完了率',         linkedKpi: '受注率',       target: '95%',   current: '88%', freq: '隔週', pct: 92, danger: false },
      { id: 'p_suzuki_2', name: '不具合の再発防止提案',       linkedKpi: '顧客訪問回数', target: '月1件', current: '1件', freq: '月次', pct: 100, danger: false }
    ],
    yamamoto: [
      { id: 'p_yamamoto_1', name: '既存顧客の継続率',         linkedKpi: '受注率',       target: '95%',   current: '90%',    freq: '月次', pct: 94, danger: false },
      { id: 'p_yamamoto_2', name: '担当エリアの訪問回数',     linkedKpi: '顧客訪問回数', target: '週3回', current: '週1.5回', freq: '週次', pct: 50, danger: true }
    ],
    sato: [
      { id: 'p_sato_1', name: '請求処理の正確性',             linkedKpi: '満足度 90点',   target: 'エラー0件', current: 'エラー0件', freq: '月次', pct: 100, danger: false },
      { id: 'p_sato_2', name: '日報の提出率',                 linkedKpi: '指針浸透指標', target: '週5日',     current: '週2日',     freq: '週次', pct: 40,  danger: true }
    ]
  };

  function kgi() { return HoshinStore.get(KGI_KEY, DEFAULT_KGI); }
  function kpiAll() { return HoshinStore.get(KPI_KEY, DEFAULT_KPI); }
  // 部署ごとのKPIを返す。dept 省略時は営業（後方互換）。
  function kpi(dept) {
    const all = kpiAll();
    return all[dept || 'sales'] || [];
  }
  function personal(memberId) {
    const all = HoshinStore.get(PERSONAL_KEY, DEFAULT_PERSONAL);
    return all[memberId] || [];
  }
  function allPersonal() { return HoshinStore.get(PERSONAL_KEY, DEFAULT_PERSONAL); }

  // 部署ごとのKPIを保存。saveKpi(dept, rows)。後方互換で saveKpi(rows) は営業に保存。
  function saveKpi(dept, rows) {
    if (rows === undefined) { rows = dept; dept = 'sales'; }
    const all = kpiAll();
    all[dept] = rows;
    HoshinStore.set(KPI_KEY, all);
  }
  function savePersonal(memberId, rows) {
    const all = allPersonal();
    all[memberId] = rows;
    HoshinStore.set(PERSONAL_KEY, all);
  }

  return { kgi, kpi, kpiAll, personal, allPersonal, saveKpi, savePersonal };
})();
