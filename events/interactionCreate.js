import {
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ThreadAutoArchiveDuration,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    const client = interaction.client;

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

    if (interaction.isButton()) {
      if (interaction.customId === 'expense_apply_button') {
        if (interaction.replied || interaction.deferred) return;

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
          .setLabel('備考（任意）')
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
          console.error(`モーダル表示エラー [${interaction.user.tag}]:`, error);
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'モーダルの表示に失敗しました。', flags: 64 });
          }
        }
      }
      return;
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'expense_apply_modal') {
        if (interaction.replied || interaction.deferred) return;

        const expenseItem = interaction.fields.getTextInputValue('expenseItem');
        const amount = interaction.fields.getTextInputValue('amount');
        const remarks = interaction.fields.getTextInputValue('remarks') || '-';

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
              reason: `経費申請スレッド作成 by ${interaction.user.tag}`,
            });
          }
        } catch (e) {
          console.error(`[${interaction.user.tag}] スレッド作成失敗:`, e);
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'スレッド作成に失敗しました。', flags: 64 });
          }
          return;
        }

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
                console.error('既存案内メッセージ削除失敗:', e);
              }
            }
          }

          const sentMessage = await thread.send(
            `**経費申請**\n- 名前: <@${interaction.user.id}>\n- 経費項目: ${expenseItem}\n- 金額: ${amount} 円\n- 備考: ${remarks}`
          );

          const formattedDate = now.toLocaleString('ja-JP', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false,
          });

          const logMessage = `${formattedDate}　${interaction.user.tag} (<@${interaction.user.id}>)　[メッセージを見る](${sentMessage.url})`;
          await channel.send(logMessage);

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('expense_apply_button')
              .setLabel('経費申請する')
              .setStyle(ButtonStyle.Primary)
          );
          await channel.send({
            content: '経費申請をする場合は以下のボタンを押してください。',
            components: [row],
          });

          // ※申請者への非公開返信を削除しました。

        } catch (e) {
          console.error(`[${interaction.user.tag}] スレッド送信失敗:`, e);
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '申請の送信に失敗しました。', flags: 64 });
          }
        }
      }
    }
  },
};

