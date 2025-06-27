if (interaction.isModalSubmit()) {
  if (interaction.customId === 'expense_apply_modal') {
    if (interaction.replied || interaction.deferred) return;

    const expenseItem = interaction.fields.getTextInputValue('expenseItem');
    const amount = interaction.fields.getTextInputValue('amount');

    const channel = interaction.channel;
    if (!channel) {
      await interaction.reply({
        content: 'このモーダルはテキストチャンネル内で使ってください。',
        flags: 64,
      });
      return;
    }

    const now = new Date();
    const yearMonth = now.toISOString().slice(0, 7); // YYYY-MM
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
      // スレッドに申請メッセージを送信し、そのメッセージオブジェクトを取得
      const sentMessage = await thread.send(
        `**経費申請**\n- 名前: <@${interaction.user.id}>\n- 経費項目: ${expenseItem}\n- 金額: ${amount} 円`
      );

      // 日時フォーマット（例: 2025/06/27 10:59:30）
      const formattedDate = now.toLocaleString('ja-JP', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
      });

      // 元チャンネルにログ送信（メッセージリンク付き）
      const logMessage = `${formattedDate}　${interaction.user.tag} (<@${interaction.user.id}>)　[メッセージを見る](${sentMessage.url})`;
      await channel.send(logMessage);

      await interaction.reply({ content: '✅ 経費申請を送信しました。', flags: 64 });
    } catch (e) {
      console.error(`[${interaction.user.tag}] スレッド送信失敗:`, e);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '申請の送信に失敗しました。', flags: 64 });
      }
    }
  }
}
