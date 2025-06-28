// keihi_setti.js
import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('経費申請設置')  // コマンド名を変更
  .setDescription('経費申請の案内メッセージを送信します');

export async function execute(interaction) {
  const channel = interaction.channel;

  if (!channel || !(channel instanceof TextChannel)) {
    await interaction.reply({
      content: 'このコマンドはテキストチャンネルでのみ使えます。',
      flags: 64,
    });
    return;
  }

  // 既存案内メッセージの削除
  try {
    const fetchedMessages = await channel.messages.fetch({ limit: 50 });
    for (const msg of fetchedMessages.values()) {
      if (
        msg.author.id === interaction.client.user.id &&
        msg.content.includes('経費申請をする場合は以下のボタンを押してください。')
      ) {
        try {
          await msg.delete();
        } catch (e) {
          console.error('既存案内メッセージの削除に失敗しました:', e);
        }
      }
    }
  } catch (err) {
    console.error('メッセージ取得失敗:', err);
  }

  // ボタン作成
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('expense_apply_button')
      .setLabel('経費申請する')
      .setStyle(ButtonStyle.Primary)
  );

  try {
    await interaction.reply({
      content: '経費申請をする場合は以下のボタンを押してください。',
      components: [row],
    });
  } catch (err) {
    console.error('案内メッセージの送信に失敗しました:', err);
  }
}

