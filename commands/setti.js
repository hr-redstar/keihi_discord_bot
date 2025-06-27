import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('setti')
  .setDescription('経費申請の案内メッセージを送信します');

export async function execute(interaction) {
  // コマンドが使われたチャンネル取得
  const channel = interaction.channel;

  if (!channel || !(channel instanceof TextChannel)) {
    await interaction.reply({ content: 'このコマンドはテキストチャンネルでのみ使えます。', ephemeral: true });
    return;
  }

  // 既存のBotの「経費申請」メッセージがあれば削除する
  const fetchedMessages = await channel.messages.fetch({ limit: 50 });
  for (const message of fetchedMessages.values()) {
    if (
      message.author.id === interaction.client.user.id &&
      message.content.includes('経費申請をする場合は以下のボタンを押してください。')
    ) {
      try {
        await message.delete();
      } catch (e) {
        console.error('既存メッセージ削除失敗:', e);
      }
    }
  }

  // 新規メッセージ送信
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('expense_apply_button')
      .setLabel('経費申請する')
      .setStyle(ButtonStyle.Primary),
  );

  await interaction.reply({
    content: '経費申請をする場合は以下のボタンを押してください。',
    components: [row],
    ephemeral: false,
  });
}
