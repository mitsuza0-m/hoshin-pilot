// ══════════════════════════════════════════════
// HoshinGoalsUI — 目標テーブル（KGI/KPI/個人目標）の共通描画・編集ロジック
// これまで 03番（指針書エディタ）と 12番（チームの目標）が別々に
// ハードコードして数値がズレていたテーブルを、data/goals.js を
// 単一情報源として同じ描画関数で表示する。
// セルを編集すると（onblur）HoshinStore に保存され、
// 同じブラウザで開いた他方のページにも反映される。
// ══════════════════════════════════════════════
const HoshinGoalsUI = (function () {

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function barColor(g) {
    if (g.danger) return 'var(--red)';
    return g.pct >= 100 ? 'var(--teal-md, var(--accent-md, #4a8c60))' : '#d4a847';
  }

  // ── KPIテーブル（03・12 共通で編集可能。部署ごとに切替可能） ──
  let currentKpiDept = 'sales'; // 現在表示中の部署（既定：営業）
  function renderKpiTable(tableId, dept) {
    if (dept) currentKpiDept = dept;
    const rows = HoshinGoals.kpi(currentKpiDept);
    const tbody = document.querySelector('#' + tableId + ' tbody');
    if (!tbody) return;
    tbody.innerHTML = rows.map(rowHtml).join('');

    function rowHtml(g) {
      return (
        '<tr data-row-id="' + g.id + '">' +
          '<td><input type="text" value="' + escapeHtml(g.name) + '" onblur="HoshinGoalsUI.saveKpiField(\'' + g.id + '\',\'name\',this.value)"></td>' +
          '<td><span class="goal-tag">' + escapeHtml(g.linkedKgi) + '</span></td>' +
          '<td><input type="text" value="' + escapeHtml(g.target) + '" style="width:72px" onblur="HoshinGoalsUI.saveKpiField(\'' + g.id + '\',\'target\',this.value)"></td>' +
          '<td><input type="text" value="' + escapeHtml(g.current) + '" style="width:72px' + (g.danger ? ';color:var(--red)' : '') + '" onblur="HoshinGoalsUI.saveKpiField(\'' + g.id + '\',\'current\',this.value)"></td>' +
          '<td><input type="text" value="' + escapeHtml(g.freq) + '" style="width:48px" onblur="HoshinGoalsUI.saveKpiField(\'' + g.id + '\',\'freq\',this.value)"></td>' +
          '<td><div class="bar-mini"><div class="bar-mini-fill" style="width:' + g.pct + '%;background:' + barColor(g) + '"></div></div> <span style="font-size:11px' + (g.danger ? ';color:var(--red)' : '') + '">' + g.pct + '%</span></td>' +
          '<td><button class="goal-del" onclick="HoshinGoalsUI.deleteKpiRow(\'' + g.id + '\')">×</button></td>' +
        '</tr>'
      );
    }
  }

  function saveKpiField(id, field, value) {
    const rows = HoshinGoals.kpi(currentKpiDept);
    const row = rows.find(r => r.id === id);
    if (!row) return;
    row[field] = value;
    HoshinGoals.saveKpi(currentKpiDept, rows);
  }

  function deleteKpiRow(id) {
    const rows = HoshinGoals.kpi(currentKpiDept).filter(r => r.id !== id);
    HoshinGoals.saveKpi(currentKpiDept, rows);
    document.querySelectorAll('table.goal-table [data-row-id="' + id + '"]').forEach(r => r.remove());
  }

  function addKpiRow(tableId) {
    const rows = HoshinGoals.kpi(currentKpiDept);
    const id = 'kpi_custom_' + Date.now();
    rows.push({ id, name: '', linkedKgi: '—', target: '', current: '', freq: '', pct: 0, danger: false });
    HoshinGoals.saveKpi(currentKpiDept, rows);
    renderKpiTable(tableId);
    const tbody = document.querySelector('#' + tableId + ' tbody');
    const input = tbody && tbody.querySelector('tr:last-child input');
    if (input) input.focus();
  }

  // ── 個人目標テーブル（03・12 共通で編集可能） ──
  let currentPersonalMember = null;

  function renderPersonalTable(tableId, memberId) {
    currentPersonalMember = memberId;
    const rows = HoshinGoals.personal(memberId);
    const tbody = document.querySelector('#' + tableId + ' tbody');
    if (!tbody) return;
    tbody.innerHTML = rows.map(rowHtml).join('');

    function rowHtml(g) {
      return (
        '<tr data-row-id="' + g.id + '">' +
          '<td><input type="text" value="' + escapeHtml(g.name) + '" onblur="HoshinGoalsUI.savePersonalField(\'' + g.id + '\',\'name\',this.value)"></td>' +
          '<td><span class="goal-tag" style="font-size:10px">' + escapeHtml(g.linkedKpi) + '</span></td>' +
          '<td><input type="text" value="' + escapeHtml(g.target) + '" style="width:64px" onblur="HoshinGoalsUI.savePersonalField(\'' + g.id + '\',\'target\',this.value)"></td>' +
          '<td><input type="text" value="' + escapeHtml(g.current) + '" style="width:56px' + (g.danger ? ';color:var(--red)' : g.pct >= 100 ? ';color:var(--owner,var(--teal,#0e5c46))' : '') + '" onblur="HoshinGoalsUI.savePersonalField(\'' + g.id + '\',\'current\',this.value)"></td>' +
          '<td><input type="text" value="' + escapeHtml(g.freq) + '" style="width:48px" onblur="HoshinGoalsUI.savePersonalField(\'' + g.id + '\',\'freq\',this.value)"></td>' +
          '<td><div class="bar-mini"><div class="bar-mini-fill" style="width:' + Math.min(g.pct, 100) + '%;background:' + barColor(g) + '"></div></div> <span style="font-size:11px' + (g.danger ? ';color:var(--red)' : '') + '">' + (g.pct >= 100 ? '達成' : g.pct + '%') + '</span></td>' +
          '<td><button class="goal-del" onclick="HoshinGoalsUI.deletePersonalRow(\'' + g.id + '\')">×</button></td>' +
        '</tr>'
      );
    }
  }

  function savePersonalField(id, field, value) {
    if (!currentPersonalMember) return;
    const rows = HoshinGoals.personal(currentPersonalMember);
    const row = rows.find(r => r.id === id);
    if (!row) return;
    row[field] = value;
    HoshinGoals.savePersonal(currentPersonalMember, rows);
  }

  function deletePersonalRow(id) {
    if (!currentPersonalMember) return;
    const rows = HoshinGoals.personal(currentPersonalMember).filter(r => r.id !== id);
    HoshinGoals.savePersonal(currentPersonalMember, rows);
    document.querySelectorAll('table.goal-table [data-row-id="' + id + '"]').forEach(r => r.remove());
  }

  function addPersonalRow(tableId) {
    if (!currentPersonalMember) return;
    const rows = HoshinGoals.personal(currentPersonalMember);
    const id = 'p_' + currentPersonalMember + '_custom_' + Date.now();
    rows.push({ id, name: '', linkedKpi: '—', target: '', current: '', freq: '', pct: 0, danger: false });
    HoshinGoals.savePersonal(currentPersonalMember, rows);
    renderPersonalTable(tableId, currentPersonalMember);
    const tbody = document.querySelector('#' + tableId + ' tbody');
    const input = tbody && tbody.querySelector('tr:last-child input');
    if (input) input.focus();
  }

  // ── 会社全体の目標（KGI）: 編集可能テーブル（経営者向け・03番） ──
  function renderKgiTable(tableId) {
    const rows = HoshinGoals.kgi();
    const tbody = document.querySelector('#' + tableId + ' tbody');
    if (!tbody) return;
    tbody.innerHTML = rows.map(rowHtml).join('');

    function rowHtml(g) {
      return (
        '<tr data-row-id="' + g.id + '">' +
          '<td><input type="text" value="' + escapeHtml(g.name) + '" onblur="HoshinGoalsUI.saveKgiField(\'' + g.id + '\',\'name\',this.value)"></td>' +
          '<td><span class="goal-tag">お客様第一</span></td>' +
          '<td><input type="text" value="' + escapeHtml(g.target) + '" style="width:72px" onblur="HoshinGoalsUI.saveKgiField(\'' + g.id + '\',\'target\',this.value)"></td>' +
          '<td><input type="text" value="' + escapeHtml(g.current) + '" style="width:72px" onblur="HoshinGoalsUI.saveKgiField(\'' + g.id + '\',\'current\',this.value)"></td>' +
          '<td><input type="text" value="12月末" style="width:56px"></td>' +
          '<td><div class="bar-mini"><div class="bar-mini-fill" style="width:' + g.pct + '%;background:' + barColor(g) + '"></div></div> <span style="font-size:11px">' + g.pct + '%</span></td>' +
          '<td><button class="goal-del" onclick="HoshinGoalsUI.deleteKgiRow(\'' + g.id + '\')">×</button></td>' +
        '</tr>'
      );
    }
  }

  function saveKgiField(id, field, value) {
    const rows = HoshinGoals.kgi();
    const row = rows.find(r => r.id === id);
    if (!row) return;
    row[field] = value;
    HoshinStore.set('goals_kgi', rows);
  }

  function deleteKgiRow(id) {
    const rows = HoshinGoals.kgi().filter(r => r.id !== id);
    HoshinStore.set('goals_kgi', rows);
    document.querySelectorAll('table.goal-table [data-row-id="' + id + '"]').forEach(r => r.remove());
  }

  function addKgiRow(tableId) {
    const rows = HoshinGoals.kgi();
    const id = 'kgi_custom_' + Date.now();
    rows.push({ id, name: '', target: '', current: '', pct: 0, color: 'gold' });
    HoshinStore.set('goals_kgi', rows);
    renderKgiTable(tableId);
  }

  // ── 会社全体の目標（KGI）: 参照表示のみ（管理職向け・12番） ──
  function renderKgiReadonly(containerId) {
    const rows = HoshinGoals.kgi();
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = rows.map(g => (
      '<div class="kgi-ref-item">' +
        '<div class="kgi-ref-name">' + escapeHtml(g.name) + '</div>' +
        '<div class="kgi-ref-nums"><strong>' + escapeHtml(g.current) + '</strong> / ' + escapeHtml(g.target) + '</div>' +
        '<div class="kgi-ref-bar-wrap"><div class="kgi-ref-bar" style="width:' + g.pct + '%;background:' + (g.color === 'teal' ? 'var(--teal-md)' : '#d4a847') + '"></div></div>' +
        '<div class="kgi-ref-pct" style="color:' + (g.color === 'teal' ? 'var(--teal)' : 'var(--gold)') + '">' + g.pct + '%</div>' +
      '</div>'
    )).join('');
  }

  return {
    renderKpiTable, saveKpiField, deleteKpiRow, addKpiRow,
    renderPersonalTable, savePersonalField, deletePersonalRow, addPersonalRow,
    renderKgiTable, saveKgiField, deleteKgiRow, addKgiRow,
    renderKgiReadonly
  };
})();
