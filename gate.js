// ══════════════════════════════════════════════
// Hoshin 合言葉ゲート（限定共有用）
// 全ページの <head> で読み込む。合言葉が未入力なら中身を隠して入力を求める。
// ※ これは「知らない人の偶然の閲覧を防ぐ」ための簡易ゲートです。
//   クライアント側判定のため、ソースを見れば回避可能な点はご了承ください
//   （本番の機密保護には、サーバー認証や有料ホストのパスワード保護が必要）。
//
// 【合言葉の変更方法】下の PASSCODE の値を書き換えてください。
// ══════════════════════════════════════════════
(function () {
  var PASSCODE = 'hoshin-pilot';        // ← ここを好きな合言葉に変更
  var OK_KEY   = 'hoshinGateOk';        // 認証済みフラグ（localStorage、デモのリセットとは別管理）

  try {
    if (localStorage.getItem(OK_KEY) === PASSCODE) return; // 認証済みなら何もしない
  } catch (e) { return; } // localStorageが使えない環境ではゲートしない

  // 中身のちらつき防止：まずページ全体を隠す
  var root = document.documentElement;
  root.style.visibility = 'hidden';

  function build() {
    root.style.visibility = '';
    var ov = document.createElement('div');
    ov.setAttribute('style', [
      'position:fixed', 'inset:0', 'z-index:2147483647',
      'background:#2d5a3d', 'display:flex', 'align-items:center', 'justify-content:center',
      'padding:20px', "font-family:'Hiragino Sans','Noto Sans JP',sans-serif"
    ].join(';'));
    ov.innerHTML =
      '<div style="background:#fff;border-radius:14px;max-width:360px;width:100%;padding:28px 24px;box-shadow:0 8px 40px rgba(0,0,0,.25);text-align:center">' +
        '<div style="font-size:22px;font-weight:800;color:#2d5a3d;letter-spacing:-.02em;margin-bottom:6px">Hoshin</div>' +
        '<div style="font-size:13px;color:#8a877e;margin-bottom:20px">合言葉を入力してください</div>' +
        '<input id="__gate_input" type="password" placeholder="合言葉" ' +
          'style="width:100%;box-sizing:border-box;border:1.5px solid #e2dfd6;border-radius:8px;padding:11px 13px;font-size:15px;font-family:inherit;margin-bottom:10px" autofocus>' +
        '<div id="__gate_err" style="display:none;font-size:12px;color:#b83232;margin-bottom:10px">合言葉が違います</div>' +
        '<button id="__gate_btn" style="width:100%;padding:12px;background:#2d5a3d;border:none;color:#fff;font-size:14px;font-weight:700;border-radius:8px;cursor:pointer;font-family:inherit">入る</button>' +
      '</div>';
    document.body.appendChild(ov);

    var input = document.getElementById('__gate_input');
    var err = document.getElementById('__gate_err');
    var btn = document.getElementById('__gate_btn');

    function tryEnter() {
      if (input.value === PASSCODE) {
        try { localStorage.setItem(OK_KEY, PASSCODE); } catch (e) {}
        ov.parentNode && ov.parentNode.removeChild(ov);
      } else {
        err.style.display = 'block';
        input.value = '';
        input.focus();
      }
    }
    btn.addEventListener('click', tryEnter);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') tryEnter(); });
    input.focus();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
