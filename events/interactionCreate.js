import {
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ThreadAutoArchiveDuration,
} from 'discord.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    const client = interaction.client;

    // スラッシュコマンド
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`コマンド実行エラー [${interaction.user.tag}]:`, error);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: 'コマンド実行中にエラーが発生しました。',
            flags: 64,
          });
        }
      }
      return;
    }

    // ボタン
    if (interaction.isButton()) {
      if (interaction.customId === 'expense_apply_button') {
        const modal = new ModalBuilder()
          .setCustomId('expense_apply_modal')
          .setTitle('経費申請フォーム');

        const expenseItemInput = new TextInputBuilder()
          .setCustomId('expenseItem')
          .setLabel('経費項目 (例: 交通費、資料代)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const amountInput = new TextInputBuilder()
          .setCustomId('amount')
          .setLabel('金額 (例: 1000)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const remarksInput = new TextInputBuilder()
          .setCustomId('remarks')
          .setLabel('備考 (任意)')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false);

        modal.addComponents(
          new ActionRowBuilder().addComponents(expenseItemInput),
          new ActionRowBuilder().addComponents(amountInput),
          new ActionRowBuilder().addComponents(remarksInput)
        );

        try {
          await interaction.showModal(modal);
        } catch (error) {
          console.error('モーダル表示エラー:', error);
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content: 'モーダルの表示に失敗しました。',
              flags: 64,
            });
          }
        }
      }
      return;
    }

    // モーダル送信
    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'expense_apply_modal') {
        const expenseItem = interaction.fields.getTextInputValue('expenseItem');
        const amount = interaction.fields.getTextInputValue('amount');
        const remarks = interaction.fields.getTextInputValue('remarks');

        const channel = interaction.channel;
        if (!channel) {
          await interaction.reply({
            content: 'このモーダルはテキストチャンネル内で使ってください。',
            flags: 64,
          });
          return;
        }

        const now = new Date();
        const yearMonth = now.toISOString().slice(0, 7);
        const threadName = `経費申請-${yearMonth}`;

        let thread;
        try {
          const threads = await channel.threads.fetch();
          thread = threads.threads.find(t => t.name === threadName);
          if (!thread) {
            thread = await channel.threads.create({
              name: threadName,
              autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
              reason: '経費申請スレッド自動作成',
            });
          }
        } catch (e) {
          console.error('スレッド作成失敗:', e);
          await interaction.reply({
            content: 'スレッド作成に失敗しました。',
            flags: 64,
          });
          return;
        }

        let sentMessage;
        try {
          sentMessage = await thread.send(
            `**経費申請**\n- 名前: <@${interaction.user.id}>\n- 経費項目: ${expenseItem}\n- 金額: ${amount} 円\n- 備考: ${remarks || 'なし'}`
          );
        } catch (e) {
          console.error('スレッド送信失敗:', e);
        }

        // ログ用メッセージをチャットに送信
        const userMention = `<@${interaction.user.id}>`;
        const userName = interaction.member?.displayName || interaction.user.username;
        const timeStamp = now.toLocaleString('ja-JP', {
          timeZone: 'Asia/Tokyo',
          hour12: false,
        }).replace(/\//g, '-').replace(',', '');
        const messageUrl = sentMessage?.url || '（リンクなし）';

        await channel.send(
          `経費申請しました。　${timeStamp}　${userName} (${userMention})　${messageUrl}`
        );

        // モーダル閉じる（必須）
        await interaction.reply({ content: '✅ 経費申請を受け付けました。', flags: 64 });
      }
    }
  },
};
