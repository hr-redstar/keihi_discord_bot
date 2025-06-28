import {
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ThreadAutoArchiveDuration,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} from 'discord.js';

import { readShopList, addShop } from '../utils/kpiFileUtil.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    const client = interaction.client;

    // スラッシュコマンド処理
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

    // ボタン押下時
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

        const notesInput = new TextInputBuilder()
          .setCustomId('notes')
          .setLabel('備考（任意）')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false);

        modal.addComponents(
          new ActionRowBuilder().addComponents(expenseItemInput),
          new ActionRowBuilder().addComponents(amountInput),
          new ActionRowBuilder().addComponents(notesInput)
        );

        try {
          await interaction.showModal(modal);
        } catch (error) {
          console.error(`モーダル表示エラー [${interaction.user.tag}]:`, error);
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'モーダルの表示に失敗しました。', flags: 64 });
          }
        }
        return;
      }

      // KPI 店舗追加ボタン
      if (interaction.customId === 'kpi_add_shop_button') {
        if (interaction.replied || interaction.deferred) return;

        const modal = new ModalBuilder()
          .setCustomId('kpi_add_shop_modal')
          .setTitle('KPI 店舗名の追加');

        const shopNameInput = new TextInputBuilder()
          .setCustomId('shopName')
          .setLabel('追加する店舗名（カンマ区切りで複数可）')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(shopNameInput));

        try {
          await interaction.showModal(modal);
        } catch (error) {
          console.error(`KPI 店舗追加モーダル表示エラー [${interaction.user.tag}]:`, error);
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'モーダルの表示に失敗しました。', flags: 64 });
          }
        }
        return;
      }

      // KPI 目標設定ボタン
      if (interaction.customId === 'kpi_set_target_button') {
        if (interaction.replied || interaction.deferred) return;

        const shops = await readShopList();
        if (shops.length === 0) {
          await interaction.reply({ content: '店舗が登録されていません。まず店舗を追加してください。', flags: 64 });
          return;
        }

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('kpi_shop_select')
          .setPlaceholder('店舗を選択してください（複数選択可）')
          .setMinValues(1)
          .setMaxValues(shops.length)
          .addOptions(
            shops.map(shop => ({
              label: shop,
              value: shop,
            }))
          );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({
          content: '目標設定のために店舗を選択してください。',
          components: [row],
          flags: 64,
        });
        return;
      }

      return;
    }

    // モーダル送信時
    if (interaction.isModalSubmit()) {
      // 経費申請モーダル
      if (interaction.customId === 'expense_apply_modal') {
        if (interaction.replied || interaction.deferred) return;

        const expenseItem = interaction.fields.getTextInputValue('expenseItem');
        const amount = interaction.fields.getTextInputValue('amount');
        const notes = interaction.fields.getTextInputValue('notes') || '（備考なし）';

        const channel = interaction.channel;
        if (!channel) {
          await interaction.reply({ content: 'この操作はテキストチャンネルでのみ可能です。', flags: 64 });
          return;
        }

        const now = new Date();
        const yearMonth = now.toISOString().slice(0, 7);
        const formattedDate = now.toLocaleString('ja-JP', {
          timeZone: 'Asia/Tokyo',
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }).replace(/\//g, '-');

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
          console.error(`[${interaction.user.tag}] スレッド取得・作成エラー:`, e);
          await interaction.reply({ content: 'スレッドの取得または作成に失敗しました。', flags: 64 });
          return;
        }

        try {
          const threadMessage = await thread.send(
            `**経費申請**\n- 名前: <@${interaction.user.id}>\n- 経費項目: ${expenseItem}\n- 金額: ${amount} 円\n- 備考: ${notes}`
          );

          await channel.send(
            `経費申請しました。　${formattedDate}　${interaction.member?.displayName || interaction.user.username} (<@${interaction.user.id}>)　${threadMessage.url}`
          );

          // 既存案内メッセージ削除（過去50件）
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
          } catch (err) {
            console.error('案内メッセージ取得失敗:', err);
          }

          // 新規案内メッセージ＋ボタン送信
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('expense_apply_button')
              .setLabel('経費申請をする場合は以下のボタンを押してください。')
              .setStyle(ButtonStyle.Primary)
          );

          await channel.send({
            content: '経費申請をする場合は以下のボタンを押してください。',
            components: [row],
          });

        } catch (e) {
          console.error(`[${interaction.user.tag}] メッセージ送信エラー:`, e);
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '申請内容の送信に失敗しました。', flags: 64 });
          }
        }
        return;
      }

      // KPI 店舗追加モーダル（複数カンマ区切り対応）
      if (interaction.customId === 'kpi_add_shop_modal') {
        if (interaction.replied || interaction.deferred) return;

        const shopNamesRaw = interaction.fields.getTextInputValue('shopName');
        const shopNames = shopNamesRaw.split(',').map(s => s.trim()).filter(s => s.length > 0);

        if (shopNames.length === 0) {
          await interaction.reply({ content: '店舗名を入力してください。', flags: 64 });
          return;
        }

        const results = [];
        for (const name of shopNames) {
          const added = await addShop(name);
          results.push({ name, added });
        }

        const addedShops = results.filter(r => r.added).map(r => r.name);
        const skippedShops = results.filter(r => !r.added).map(r => r.name);

        let replyMsg = '';
        if (addedShops.length > 0) {
          replyMsg += `以下の店舗を追加しました:\n${addedShops.join('\n')}\n`;
        }
        if (skippedShops.length > 0) {
          replyMsg += `既に登録されている店舗:\n${skippedShops.join('\n')}`;
        }

        await interaction.reply({ content: replyMsg, flags: 64 });
        return;
      }

      // KPI 目標設定モーダル送信処理（customIdに店舗名含む）
      if (interaction.customId.startsWith('kpi_set_target_modal_')) {
        if (interaction.replied || interaction.deferred) return;

        const targetDate = interaction.fields.getTextInputValue('targetDate') || '(未指定)';
        const targetCountRaw = interaction.fields.getTextInputValue('targetCount');
        const targetCount = targetCountRaw ? targetCountRaw.trim() : '(未指定)';

        // customIdから店舗情報を取得
        const shopsPart = interaction.customId.substring('kpi_set_target_modal_'.length);
        const shops = shopsPart.split(',');

        // KPI目標の永続化処理
        const fs = await import('fs/promises');
        const path = await import('path');
        const dataDir = path.resolve('./data');
        const targetFilePath = path.join(dataDir, 'kpi_targets.json');

        let targets = {};
        try {
          await fs.mkdir(dataDir, { recursive: true });
          const targetData = await fs.readFile(targetFilePath, 'utf-8');
          targets = JSON.parse(targetData);
        } catch {
          targets = {};
        }

        for (const shop of shops) {
          if (!targets[shop]) targets[shop] = [];
          targets[shop].push({
            date: targetDate,
            target: targetCount,
            setBy: interaction.user.tag,
            setAt: new Date().toISOString(),
          });
        }

        try {
          await fs.writeFile(targetFilePath, JSON.stringify(targets, null, 2), 'utf-8');
        } catch (e) {
          console.error('KPI目標保存エラー:', e);
          await interaction.reply({ content: 'KPI目標の保存に失敗しました。', flags: 64 });
          return;
        }

        await interaction.reply({
          content: `KPI目標を設定しました。\n店舗: ${shops.join(', ')}\n対象日: ${targetDate}\n目標人数: ${targetCount}`,
          flags: 64,
        });
        return;
      }
    }

    // セレクトメニュー選択時
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'kpi_shop_select') {
        const selectedShops = interaction.values;

        // 日付・目標人数入力モーダルを表示(customIdに選択店舗をカンマ区切りで含める)
        const modal = new ModalBuilder()
          .setCustomId(`kpi_set_target_modal_${selectedShops.join(',')}`)
          .setTitle('KPI 目標設定');

        const targetDateInput = new TextInputBuilder()
          .setCustomId('targetDate')
          .setLabel('対象日（任意）例: 2025-07-01')
          .setStyle(TextInputStyle.Short)
          .setRequired(false);

        const targetCountInput = new TextInputBuilder()
          .setCustomId('targetCount')
          .setLabel('目標人数（任意）例: 20')
          .setStyle(TextInputStyle.Short)
          .setRequired(false);

        modal.addComponents(
          new ActionRowBuilder().addComponents(targetDateInput),
          new ActionRowBuilder().addComponents(targetCountInput),
        );

        try {
          await interaction.showModal(modal);
        } catch (error) {
          console.error('KPI 目標設定モーダル表示エラー:', error);
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'モーダルの表示に失敗しました。', flags: 64 });
          }
        }
        return;
      }
    }
  },
};

