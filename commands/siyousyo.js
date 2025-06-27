import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('仕様書')
  .setDescription('経費申請Botの仕様書を表示します');

const specText = `
>>> **📄 経費申請Bot 仕様書**

---

### 🧾 概要
このBotは、**Discord上で簡単に経費申請を行うためのツール**です。  
モーダルフォームを用いた申請と、スレッドでの記録・共有が特徴です。

---

### ✅ 主な機能

- \`/setti\` コマンドで案内メッセージ＋ボタンを送信
- 「経費申請する」ボタン → モーダルフォーム表示
- 入力完了後、指定スレッドに内容を投稿
- 申請者のユーザー名＋メンションを自動取得
- テキストチャンネルに、申請通知＋メッセージリンクを投稿

---

### 🔁 操作フロー

1. **管理者等が** \`/setti\` を実行
2. Botが案内メッセージとボタンを送信
3. ユーザーがボタンを押す → モーダルが表示
4. 「経費項目・金額・備考」を入力し送信
5. 指定スレッド（経費申請-YYYY-MM）に申請内容を投稿
6. テキストチャンネルに、**日時・名前・メンション・リンク**付きで通知

---

### 📌 補足仕様

- スレッド名は月ごとに「\`経費申請-YYYY-MM\`」で統一
- 同月に複数人が申請してもスレッドは共用
- Botが送信した案内メッセージは、同内容があれば削除して再投稿
- メンションは \`<@ユーザーID>\` 形式で常にリンク可能
- 備考欄は任意・長文対応

---

### 🛠 技術補足

- モーダルは Discord.js v14 の Modal API を使用
- Render 上で常時稼働（ポート監視付き）
- エラーハンドリング済（API失敗などに備える）

---

🔧 開発・運用: **redstar hr**  
📧 お問い合わせ: redstar.hoshir@gmail.com
`;

export async function execute(interaction) {
  try {
    await interaction.reply({
      content: specText,
      flags: 64, // Ephemeral (非公開)
    });
  } catch (error) {
    console.error('仕様書コマンドエラー:', error);
    if (!interaction.replied) {
      await interaction.reply({
        content: 'エラーが発生しました。',
        flags: 64,
      });
    }
  }
}


