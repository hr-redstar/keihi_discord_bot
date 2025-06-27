import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('仕様書')
  .setDescription('経費申請Botの最新版仕様書を表示します');

const specText = `
【経費申請Bot 仕様書（最新版）】

1. 概要
Discord上で経費申請を簡単かつスムーズに行うためのBot。
案内メッセージとボタン操作でモーダルを表示し、
申請内容を月別スレッドに整理して投稿します。

2. 主な機能
・/setti で経費申請案内メッセージ＋ボタンを送信
・ボタン押下で経費申請フォーム（項目・金額・備考）モーダル表示
・申請内容は月別スレッド（経費申請-YYYY-MM）に投稿
・投稿時は申請者メンション付きで名前を表示
・申請ログを元チャンネルに日時・メンション・メッセージリンク付きで投稿
・申請後、案内メッセージ＋ボタンを再表示

3. 操作フロー
1) /setti 実行 → 案内メッセージとボタン表示
2) ボタン押下 → モーダル表示
3) 入力 → 月別スレッドに申請投稿
4) 元チャンネルに申請ログと案内再表示

4. 注意点
・/setti はテキストチャンネル限定
・スレッドは「経費申請-YYYY-MM」の月別スレッドのみ作成
・名前はユーザーIDでメンション表示（ユーザー名変更対応）
・備考欄は任意入力（未入力時は「-」表示）
・既存案内メッセージは削除して最新のみ表示
・申請者への確認の非公開返信はなし
・エラーはログに出力しユーザーに通知

---

詳しい内容はお問い合わせください。  
redstar hr (redstar.hoshir@gmail.com)
`;

export async function execute(interaction) {
  try {
    await interaction.reply({ content: specText, flags: 64 });
  } catch (error) {
    console.error('仕様書コマンドエラー:', error);
    if (!interaction.replied) {
      await interaction.reply({ content: 'エラーが発生しました。', flags: 64 });
    }
  }
}

