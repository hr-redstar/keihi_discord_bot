import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('仕様書')
  .setDescription('経費申請Botの仕様書を表示します');

const specText = `
【経費申請Bot 仕様書】

1. 概要
Discord上で経費申請を簡単に行うBot。案内メッセージ＋モーダル入力で申請。

2. 主な機能
・/setti で案内メッセージを送信
・「経費申請する」ボタンでモーダル表示
・申請内容はユーザー別スレッドに投稿
・申請完了は本人に非公開メッセージで通知

3. 操作フロー
1) /setti実行 → 案内メッセージ表示
2) ボタン押下 → モーダル表示
3) 入力 → スレッドに申請投稿
4) 完了通知をユーザーに送信

4. 注意点
・テキストチャンネル限定コマンド
・スレッド名は「経費申請-ユーザー名」
・エラーハンドリングあり

---

詳しい内容は必要に応じてお問い合わせください。  
redstar hr (redstar.hoshir@gmail.com)
`;

export async function execute(interaction) {
  try {
    await interaction.reply({ content: specText, ephemeral: true });
  } catch (error) {
    console.error('仕様書コマンドエラー:', error);
    if (!interaction.replied) {
      await interaction.reply({ content: 'エラーが発生しました。', ephemeral: true });
    }
  }
}
