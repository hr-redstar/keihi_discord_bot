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
    // 既存案内メッセージ削除
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
            console.error('既存メッセージ削除失敗:', e);
          }
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
    });

  } catch (err) {
    console.error('案内メッセージ送信に失敗しました:', err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '案内メッセージの送信に失敗しました。',
        ephemeral: true,
      });
    }
  }
}
