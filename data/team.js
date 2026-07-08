// ══════════════════════════════════════════════
// HoshinTeam — 営業チームのメンバー名簿（単一情報源）
// ══════════════════════════════════════════════
// avatarClass はページのテーマ配色に依存しないよう "member-xxx" という
// 中立的な名前にしてある。各ページのCSS側で、自分のテーマ色に
// 合わせて .member-tanaka 等の見た目（背景色・文字色）を定義すること。
const HoshinTeam = {
  members: [
    { id: 'tanaka',   name: '田中 一郎', dept: '営業部', role: 'manager', avatarInitial: '田', avatarClass: 'member-tanaka'   },
    { id: 'suzuki',   name: '鈴木 花子', dept: '開発部', role: 'member',  avatarInitial: '鈴', avatarClass: 'member-suzuki'   },
    { id: 'yamamoto', name: '山本 次郎', dept: '営業部', role: 'member',  avatarInitial: '山', avatarClass: 'member-yamamoto' },
    { id: 'sato',     name: '佐藤 健太', dept: '管理部', role: 'member',  avatarInitial: '佐', avatarClass: 'member-sato'     },
    { id: 'yamada',   name: '山田 花子', dept: '営業部', role: 'member',  avatarInitial: '山', avatarClass: 'member-yamada'   }
  ],
  byId(id) {
    return this.members.find(m => m.id === id) || null;
  }
};
