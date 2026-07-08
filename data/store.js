// ══════════════════════════════════════════════
// HoshinStore — 複数ページ間でデータを共有するための最小限のラッパー
// 実際のバックエンドがない静的モックのため、ブラウザの localStorage を
// 「単一の情報源（Single Source of Truth）」として扱う。
// 同じブラウザで別ページを開くと、ここに保存した変更（コメント送信・
// 目標の数値更新など）が引き継がれる。
// ══════════════════════════════════════════════
const HoshinStore = (function () {
  const PREFIX = 'hoshin_v8:';

  function get(key, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
      // 保存できない環境（プライベートブラウズ等）ではモック動作を止めない
    }
  }

  function remove(key) {
    try { localStorage.removeItem(PREFIX + key); } catch (e) { /* noop */ }
  }

  function resetAll() {
    try {
      Object.keys(localStorage)
        .filter(k => k.indexOf(PREFIX) === 0)
        .forEach(k => localStorage.removeItem(k));
    } catch (e) { /* noop */ }
  }

  return { get, set, remove, resetAll };
})();
