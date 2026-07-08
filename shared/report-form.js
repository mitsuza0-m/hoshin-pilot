// ══════════════════════════════════════════════
// HoshinReportForm — 日報作成ページ（06/10番）の共通ロジック
// ステップ遷移・タスクチェック・コンディション選択・指針タグ・
// 感謝/称賛の人物追加・AI生成演出・偉人の言葉ローテーション・送信完了を
// 1箇所にまとめ、06（社員）・10（管理職）が別々に持っていた
// ほぼ同一のJSの重複を解消する。
//
// ページ側は memberList / wisdoms / 共有先の文言など「人によって違う中身」
// だけを config として渡し、HoshinReportForm.init(config) を呼ぶ。
//
// config:
//   memberList        : [{ name, initial, color, textColor }, ...]
//   addedThanks       : 初期状態で追加済みの memberList インデックス配列
//   addedPraise       : 同上（称賛用）
//   wisdoms           : [{ type, main, reading, meaning, color:[...] }, ...]
//   stressShareTarget : ストレスチェックで「つらい」を選んだ時の共有先の呼び方（例：'上司' '経営者'）
// ══════════════════════════════════════════════
const HoshinReportForm = (function () {
  let memberList = [];
  let addedThanks = new Set();
  let addedPraise = new Set();
  let wisdoms = [];
  let wisdomIdx = 0;
  let stressShareTarget = '上司';
  let memberId = null;
  let homeUrl = '07_member_home.html';
  let toastTimer;

  function init(config) {
    memberList = config.memberList || [];
    addedThanks = new Set(config.addedThanks || []);
    addedPraise = new Set(config.addedPraise || []);
    wisdoms = config.wisdoms || [];
    stressShareTarget = config.stressShareTarget || '上司';
    memberId = config.memberId || null;
    homeUrl = config.homeUrl || '07_member_home.html';
    renderPolicyTags();
    initFridayCheck(config.isFriday !== false);
  }

  // ── 指針タグを、公開済み指針書（HoshinStore: policyPublished）から動的生成 ──
  // 経営者が03で公開した「バリュー（価値観）」を、そのまま日報の選択肢にする。
  // ※ 行動指針は具体的な行動ルール（長文）なのでタグには使わず、浸透度はバリュー単位で測る。
  // 未公開の場合は、HTMLに書かれたデフォルトのタグをそのまま使う（フォールバック）。
  function renderPolicyTags() {
    if (typeof HoshinStore === 'undefined') return;
    const p = HoshinStore.get('policyPublished', null);
    if (!p) return;
    const titles = [];
    (p.values || []).forEach(item => {
      const t = (item && item.title || '').trim();
      if (t && titles.indexOf(t) === -1) titles.push(t);
    });
    if (!titles.length) return;
    const grid = document.querySelector('#section-tags .tag-grid');
    if (!grid) return;
    grid.innerHTML = '';
    titles.forEach((t, i) => {
      const el = document.createElement('div');
      el.className = 'tag' + (i < 2 ? ' on' : ''); // 先頭2件をAI提案として初期選択
      el.textContent = t;
      el.addEventListener('click', () => toggleTag(el));
      grid.appendChild(el);
    });
    // AI提案の文言も、実際の指針に合わせて更新（旧タグ名の残り防止）
    const hint = document.querySelector('#section-tags .ai-suggest > div:last-child');
    if (hint && titles.length >= 2) {
      hint.textContent = 'AIが「' + titles[0] + '」「' + titles[1] + '」を提案しています。このまま送っても大丈夫です。';
    }
  }

  // ── 週末限定項目の曜日判定 ──
  // デモ用: isFriday は呼び出し側で固定値を渡す（本番は new Date().getDay() === 5 に変更）
  function initFridayCheck(isFriday) {
    const fridaySections = ['section-friday-banner', 'section-thanks', 'section-praise', 'section-reflect'];
    window.addEventListener('DOMContentLoaded', () => {
      fridaySections.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (!isFriday) {
          el.style.display = 'none';
          const s5 = document.getElementById('step5');
          if (s5) s5.style.opacity = '0.3';
        }
      });
      const checkGrid = document.querySelector('.check-grid');
      if (checkGrid && !isFriday) {
        checkGrid.querySelectorAll('.check-item').forEach(item => {
          const t = item.textContent;
          if (t.includes('感謝') || t.includes('頑張') || t.includes('振り返り') || t.includes('偉人')) {
            item.style.opacity = '0.4';
          }
        });
      }
    });
  }

  // ── トースト ──
  function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  // ── 感謝・称賛 人を追加 ──
  function addPerson(type) {
    const listId = type === 'thanks' ? 'thanks-list' : 'praise-list';
    const added = type === 'thanks' ? addedThanks : addedPraise;
    const placeholder = type === 'thanks'
      ? '感謝のひとこと（例：急なお願いにも対応してくれてありがとう）'
      : 'どんなところが頑張っていたか（例：毎日早めに来て準備していた）';

    const next = memberList.findIndex((_, i) => !added.has(i));
    if (next === -1) { showToast('追加できるメンバーがいません'); return; }
    added.add(next);
    const m = memberList[next];

    const list = document.getElementById(listId);
    const card = document.createElement('div');
    card.className = 'person-card';
    card.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg);border-radius:var(--radius-sm);margin-bottom:7px';
    card.innerHTML =
      '<div class="person-avatar" style="width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;flex-shrink:0;background:' + m.color + ';color:' + m.textColor + '">' + m.initial + '</div>' +
      '<div class="person-input" style="flex:1">' +
        '<div class="person-name" style="font-size:13px;font-weight:600;color:var(--ink);margin-bottom:3px">' + m.name + '</div>' +
        '<input type="text" placeholder="' + placeholder + '" style="width:100%;border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:7px 10px;font-size:12px;font-family:inherit;color:var(--ink);background:var(--surface)">' +
      '</div>' +
      '<button class="remove-btn" onclick="this.closest(\'.person-card\').remove();HoshinReportForm.showToast(\'削除しました\')" style="background:none;border:none;cursor:pointer;color:var(--ink-4);font-size:18px;padding:4px;flex-shrink:0;border-radius:4px">×</button>';
    list.appendChild(card);
    card.querySelector('input').focus();
    showToast(m.name + ' を追加しました');
  }

  function removePerson(btn) {
    btn.closest('.person-card').remove();
    showToast('削除しました');
  }

  // ── タスクのチェック ──
  function toggleTask(n) {
    const chk = document.getElementById('chk' + n);
    const txt = document.getElementById('txt' + n);
    const item = document.getElementById('task' + n);
    const isDone = chk.classList.contains('checked');
    if (isDone) {
      chk.classList.remove('checked');
      txt.classList.remove('done');
      item.classList.add('pending');
    } else {
      chk.classList.add('checked');
      txt.classList.add('done');
      item.classList.remove('pending');
      const label = item.querySelector('.task-pending-label');
      if (label) label.style.display = 'none';
    }
    showToast(isDone ? 'チェックを外しました' : '完了しました ✓');
  }

  // ── コンディション（ストレスチェック） ──
  function selectMood(btn, mood) {
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const note = document.getElementById('mood-warn-note');
    note.classList.toggle('show', mood === 'bad');
    if (mood === 'bad') {
      showToast('この内容は' + stressShareTarget + 'にのみ共有されます');
    }
  }

  // ── 指針タグ ──
  function toggleTag(el) {
    el.classList.toggle('on');
    showToast(el.classList.contains('on') ? '「' + el.textContent + '」を選択しました' : '「' + el.textContent + '」の選択を外しました');
  }

  // ── ステップ遷移（視覚的フォーカス） ──
  function goStep(n) {
    for (let i = 3; i <= 6; i++) {
      const el = document.getElementById('step' + i);
      if (!el) continue;
      el.className = 'step ' + (i < n ? 'step-done' : i === n ? 'step-active' : 'step-todo');
      el.querySelector('.step-circle').textContent = i < n ? '✓' : i;
    }
    for (let i = 1; i <= 3; i++) {
      const el = document.getElementById('line' + [34, 45, 56][i - 1]);
      if (el) el.className = 'step-line' + (i < n - 2 ? ' done' : '');
    }
    const targets = {
      1: 'section-task-today', 2: 'section-task-tmr', 3: 'section-report',
      4: 'section-tags', 5: 'section-thanks', 6: 'section-submit'
    };
    const t = document.getElementById(targets[n]);
    if (t) setTimeout(() => {
      const offset = t.getBoundingClientRect().top + window.pageYOffset - 72;
      window.scrollTo({ top: offset, behavior: 'smooth' });
    }, 100);
  }

  // ── AIメッセージ生成（演出のみ） ──
  function generateAI(btn) {
    const aiBox = document.getElementById('ai-box');
    const wisdom = document.getElementById('wisdom-card');
    btn.textContent = '✦ 生成中...';
    btn.disabled = true;

    setTimeout(() => {
      btn.textContent = '✨ AIからのメッセージを受け取る';
      btn.disabled = false;
      aiBox.classList.add('show');
      wisdom.classList.add('show');
      aiBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
      showToast('AIからのメッセージが届きました ✨');
    }, 1800);
  }

  // ── 偉人の言葉ローテーション ──
  function rotateWisdom() {
    if (!wisdoms.length) return;
    wisdomIdx = (wisdomIdx + 1) % wisdoms.length;
    const w = wisdoms[wisdomIdx];
    const el = document.getElementById('wisdom-card');
    el.style.background = w.color[3];
    el.style.border = w.color[2];
    el.querySelector('.wisdom-type').style.color = w.color[0];
    el.querySelector('.wisdom-main').style.color = w.color[0];
    el.querySelector('.wisdom-reading').style.color = w.color[0];
    el.querySelector('.wisdom-divider').style.background = w.color[0];
    el.querySelector('.wisdom-meaning').style.color = w.color[0];
    el.querySelector('.wisdom-type').textContent = w.type;
    el.querySelector('.wisdom-main').textContent = w.main;
    el.querySelector('.wisdom-reading').textContent = w.reading;
    el.querySelector('.wisdom-meaning').textContent = w.meaning;
    showToast('別の言葉に変えました');
  }

  // ── 日報送信 ──
  // memberId が渡されていれば、実際に HoshinReports（単一情報源）へ保存する。
  // これにより09/11の日報一覧にも反映される。デモの「今日」は固定で2024年8月9日（金）。
  function submitReport() {
    if (typeof HoshinReports !== 'undefined' && memberId) {
      const bodyTextareas = document.querySelectorAll('#section-report textarea');
      const tags = Array.from(document.querySelectorAll('#section-tags .tag.on')).map(t => t.textContent).join(' / ');
      HoshinReports.add({
        id: memberId + '_20240809',
        memberId: memberId,
        date: '2024年8月9日（金）', dateLabel: '今日', sortKey: 20240809,
        tag: tags, ai: 'check',
        body: bodyTextareas[0] ? bodyTextareas[0].value : '',
        learning: bodyTextareas[1] ? bodyTextareas[1].value : ''
      });
    }
    document.getElementById('complete-overlay').classList.add('show');
  }
  function closeComplete() {
    document.getElementById('complete-overlay').classList.remove('show');
    showToast('ホームに戻ります');
    setTimeout(() => { location.href = homeUrl; }, 500);
  }

  return {
    init, showToast, addPerson, removePerson, toggleTask, selectMood,
    toggleTag, goStep, generateAI, rotateWisdom, submitReport, closeComplete
  };
})();
