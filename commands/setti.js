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

    // スラッシュコマンド実行時
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error('コマンド実行エラー:', error);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: 'コマンド実行中にエラーが発生しました。', flags: 64 });
        }
      }
      return;
    }

    // ボタン押下時
    if (interaction.isButton()) {
      if (interaction.customId === 'expense_apply_button') {
        // 経費申請フォームモーダル作成
        const modal = new ModalBuilder()
          .setCustomId('expense_apply_modal')
          .setTitle('経費申請フォーム');

        const displayNameInput = new TextInputBuilder()
          .setCustomId('displayName')
          .setLabel('あなたの名前')
          .setStyle(TextInputStyle.Short)
          .setValue(interaction.member?.displayName || interaction.user.username)
          .setRequired(true);

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

        modal.addComponents(
          new ActionRowBuilder().addComponents(displayNameInput),
          new ActionRowBuilder().addComponents(expenseItemInput),
          new ActionRowBuilder().addComponents(amountInput),
        );

        await interaction.showModal(modal);
      }
      return;
    }

    // モーダル送信時
    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'expense_apply_modal') {
        const displayName = interaction.fields.getTextInputValue('displayName');
        const expenseItem = interaction.fields.getTextInputValue('expenseItem');
        const amount = interaction.fields.getTextInputValue('amount');

        const channel = interaction.channel;
        if (!channel) {
          await interaction.reply({ content: 'このモーダルはテキストチャンネル内で使ってください。', flags: 64 });
          return;
        }

        // 現在の年月を "YYYY-MM" 形式で取得
        const now = new Date();
        const yearMonth = now.toISOString().slice(0, 7); // 例: "2025-06"

        // スレッド名を年月＋ユーザー名で設定
        const threadName = `経費申請-${yearMonth}-${interaction.user.username}`;

        // チャンネル内のスレッドを検索
        let thread = channel.threads.cache.find(t => t.name === threadName);

        // なければ新規作成
        if (!thread) {
          try {
            thread = await channel.threads.create({
              name: threadName,
              autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
              reason: '経費申請のスレッド作成',
            });
          } catch (e) {
            console.error('スレッド作成に失敗しました:', e);
            await interaction.reply({ content: 'スレッド作成に失敗しました。', flags: 64 });
            return;
          }
        }

        // スレッドに申請内容を送信
        await thread.send(
          `**経費申請**\n- 名前: ${displayName}\n- 経費項目: ${expenseItem}\n- 金額: ${amount} 円`,
        );

        // 申請者へ完了メッセージ（他の人には見えない）
        await interaction.reply({ content: '✅ 経費申請を送信しました。', flags: 64 });
      }
      return;
    }
  },
};
