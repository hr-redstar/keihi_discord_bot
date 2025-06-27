import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('setti')
  .setDescription('経費申請の案内メッセージを送信します');

export async function execute(interaction) {
  const channel = interaction.channel;

  if (!channel || !(channel instanceof TextChannel)) {
    await interaction.reply({
      content: 'このコマンドはテキストチャンネルでのみ使えます。',
      ephemeral: true,
    });
    return;
  }

  try {
    // 既存案内メッセージ削除（50件まで取得し条件に合うメッセージを削除）
    const fetchedMessages = await channel.messages.fetch({ limit: 50 });
    for (const msg of fetchedMessages.values()) {
      if (
        msg.author.id === interaction.client.user.id &&
        msg.content.includes('経費申請をする場合は以下のボタンを押してください。')
      ) {
        try {
          await msg.delete();
        } catch (e) {
          if (e.code !== 10008) {
            // Unknown Message以外はログ出力
            console.error('既存メッセージ削除失敗:', e);
          }
          // Unknown Messageは無視
        }
      }
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('expense_apply_button')
        .setLabel('経費申請する')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      content: '経費申請をする場合は以下のボタンを押してください。',
      components: [row],
      ephemeral: false,
      // fetchReplyは非推奨なので使わずに、返信後にfetchReplyする方法に変更
    });

    // 返信後にメッセージ取得（discord.jsバージョンにより fetchReply() が使えるか確認）
    const botMessage = await interaction.fetchReply();
    if (botMessage && botMessage.pin) {
      await botMessage.pin();
    }

  } catch (err) {
    console.error('案内メッセージ送信またはピン留めに失敗しました:', err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '案内メッセージの送信に失敗しました。',
        ephemeral: true,
      });
    }
  }
}

