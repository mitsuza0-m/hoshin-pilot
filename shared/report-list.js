// ══════════════════════════════════════════════
// HoshinReportList — 日報一覧ページ（09/11番）の共通ロジック
// 一覧の描画・フィルタ・検索・詳細モーダル・コメント送信を1箇所にまとめ、
// 09（経営者）・11（管理職）が別々に持っていた重複コードを解消する。
// 各ページ側は下記のDOM構造とCSSクラス（report-item, ai-chip, ai-match,
// ai-check, comment-badge, badge-uncommented, badge-commented 等）を
// あらかじめ用意し、HoshinReportList.init(config) を呼ぶだけでよい。
//
// config:
//   memberIds   : 対象メンバーIDの配列。null なら全メンバー（経営者用）
//   listEl      : 一覧を描画する要素
//   emptyEl     : 該当なし時に表示する要素
//   deptSelectEl: 部門フィルタの <select>（任意。無ければ部門フィルタなし）
//   searchEl    : 検索用の <input>
//   toast       : トースト表示関数 toast(msg)
// ══════════════════════════════════════════════
const HoshinReportList = (function () {
  let config = null;
  let filter = 'all';
  let currentId = null;

  function render() {
    const dept = config.deptSelectEl ? config.deptSelectEl.value : 'all';
    const rawSearch = config.searchEl ? config.searchEl.value.trim() : '';

    const rows = HoshinReports.list(config.memberIds).filter(r => {
      const member = HoshinTeam.byId(r.memberId);
      if (filter === 'uncommented' && r.commented) return false;
      if (filter === 'commented' && !r.commented) return false;
      if (filter === 'check' && r.ai === 'match') return false;
      if (dept !== 'all' && member.dept !== dept) return false;
      if (rawSearch && member.name.indexOf(rawSearch) === -1) return false;
      return true;
    });

    config.listEl.innerHTML = rows.map(rowHtml).join('');
    if (config.emptyEl) config.emptyEl.style.display = rows.length === 0 ? 'block' : 'none';
  }

  function rowHtml(r) {
    const m = HoshinTeam.byId(r.memberId);
    const ai = HoshinReports.aiLabel(r.ai);
    const aiClass = ai.kind === 'match' ? 'ai-match' : 'ai-check';
    const badgeClass = r.commented ? 'badge-commented' : 'badge-uncommented';
    const badgeText = r.commented ? 'コメント済み' : '未コメント';
    const tags = r.tag.split(' / ').map(t => '<span class="tag">' + t + '</span>').join('');
    return (
      '<div class="report-item" onclick="HoshinReportList.open(\'' + r.id + '\')">' +
        '<div class="report-top">' +
          '<div class="report-avatar ' + m.avatarClass + '">' + m.avatarInitial + '</div>' +
          '<span class="report-name">' + m.name + '</span>' +
          '<span class="report-dept">' + m.dept + '</span>' +
          '<span class="comment-badge ' + badgeClass + '">' + badgeText + '</span>' +
          '<span class="report-date">' + r.dateLabel + '</span>' +
        '</div>' +
        '<div style="margin-bottom:5px">' + tags + '</div>' +
        '<div class="report-body">' + r.body + '</div>' +
        '<span class="ai-chip ' + aiClass + '" style="margin-left:0">' + ai.label + '</span>' +
      '</div>'
    );
  }

  function setFilter(f, btn) {
    filter = f;
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    render();
  }

  function open(id) {
    const r = HoshinReports.get(id);
    if (!r) return;
    const m = HoshinTeam.byId(r.memberId);
    const ai = HoshinReports.aiLabel(r.ai);
    currentId = id;

    document.getElementById('report-name').textContent = m.name + 'の日報';
    document.getElementById('report-dept-date').textContent = m.dept + ' ・ ' + r.date;
    document.getElementById('report-tag').textContent = r.tag;
    const aiEl = document.getElementById('report-ai');
    aiEl.className = 'ai-chip ' + (ai.kind === 'match' ? 'ai-match' : 'ai-check');
    aiEl.textContent = ai.label;
    document.getElementById('report-body').textContent = r.body;

    const existing = document.getElementById('report-existing-comment');
    const wrap = document.getElementById('report-comment-wrap');
    const sendBtn = document.getElementById('report-send-btn');
    const closeBtn = document.getElementById('report-close-btn');
    if (r.commented) {
      existing.style.display = 'block';
      existing.innerHTML = '<strong>送信済みのコメント：</strong>' + r.comment;
      wrap.style.display = 'none';
      // 送信済みなら「コメントを送る」ボタンは不要。閉じるボタンだけを全幅で残す
      // （元は送信ボタンのテキストを「閉じる」に差し替えていたため、閉じるボタンが2つ並んでいた）。
      sendBtn.style.display = 'none';
      if (closeBtn) closeBtn.style.flex = '1';
    } else {
      existing.style.display = 'none';
      wrap.style.display = 'block';
      document.getElementById('report-comment-area').value = '';
      sendBtn.style.display = '';
      sendBtn.textContent = '✉️ コメントを送る';
      sendBtn.onclick = sendComment;
      if (closeBtn) closeBtn.style.flex = '0 0 auto';
    }
    document.getElementById('report-overlay').style.display = 'flex';
  }

  function close() {
    document.getElementById('report-overlay').style.display = 'none';
  }

  function sendComment() {
    const val = document.getElementById('report-comment-area').value.trim();
    if (!val) { config.toast('コメントを入力してください'); return; }
    HoshinReports.sendComment(currentId, val);
    close();
    config.toast('コメントを送りました ✉️');
    render();
  }

  function init(cfg) {
    config = cfg;
    filter = 'all';
    render();
  }

  return { init, setFilter, open, close, sendComment, render };
})();
