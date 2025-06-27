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

  // テキストチャンネル以外では使えない旨を返す
  if (!channel || !(channel instanceof TextChannel)) {
    await interaction.reply({
      content: 'このコマンドはテキストチャンネルでのみ使えます。',
      flags: 64, // ephemeral: true と同義
    });
    return;
  }

  // 既存の案内メッセージを削除する処理
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
    console.error('チャンネル内メッセージの取得に失敗しました:', err);
  }

  // 案内メッセージとボタンの送信およびピン留め
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('expense_apply_button')
      .setLabel('経費申請する')
      .setStyle(ButtonStyle.Primary)
  );

  try {
    const botMessage = await interaction.reply({
      content: '経費申請をする場合は以下のボタンを押してください。',
      components: [row],
      fetchReply: true,
    });
    await botMessage.pin();
  } catch (err) {
    console.error('案内メッセージの送信またはピン留めに失敗しました:', err);
  }
}

