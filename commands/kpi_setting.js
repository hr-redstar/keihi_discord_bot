import { SlashCommandBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { addShop, addTargets } from '../utils/kpiFileUtil.js';

export const data = new SlashCommandBuilder()
  .setName('kpi_設定')
  .setDescription('KPI用の店舗設定や目標を登録します');

export async function execute(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('kpi_setting_modal')
    .setTitle('KPI 店舗・目標 設定');

  const newShopInput = new TextInputBuilder()
    .setCustomId('newShop')
    .setLabel('追加する店舗名（カンマ区切り可）')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const dateInput = new TextInputBuilder()
    .setCustomId('targetDate')
    .setLabel('対象日（例: 2025-07-01）')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const targetInput = new TextInputBuilder()
    .setCustomId('targetCount')
    .setLabel('目標人数（例: 20）')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(newShopInput),
    new ActionRowBuilder().addComponents(dateInput),
    new ActionRowBuilder().addComponents(targetInput),
  );

  await interaction.showModal(modal);
}

// 以下は interactionCreate イベントで処理してください

export async function handleKpiSettingModal(interaction) {
  if (interaction.customId !== 'kpi_setting_modal') return false;

  const newShopRaw = interaction.fields.getTextInputValue('newShop').trim();
  const targetDate = interaction.fields.getTextInputValue('targetDate').trim();
  const targetCount = interaction.fields.getTextInputValue('targetCount').trim();

  if (!targetDate) {
    await interaction.reply({ content: '対象日は必須です。', ephemeral: true });
    return true;
  }
  if (!targetCount) {
    await interaction.reply({ content: '目標人数は必須です。', ephemeral: true });
    return true;
  }

  // 新店舗があれば追加
  let newShops = [];
  if (newShopRaw.length > 0) {
    newShops = newShopRaw.split(',').map(s => s.trim()).filter(s => s.length > 0);
    for (const shop of newShops) {
      await addShop(shop);
    }
  }

  if (newShops.length === 0) {
    await interaction.reply({ content: '店舗名が入力されなかったため、目標設定は保存されませんでした。', ephemeral: true });
    return true;
  }

  // 目標情報をkpi_ninzuu.jsonに保存
  const success = await addTargets(newShops, targetDate, targetCount, interaction.user.tag);
  if (!success) {
    await interaction.reply({ content: 'KPI目標の保存に失敗しました。', ephemeral: true });
    return true;
  }

  await interaction.reply({
    content: `以下の店舗に目標を設定しました。\n店舗: ${newShops.join(', ')}\n対象日: ${targetDate}\n目標人数: ${targetCount}`,
    ephemeral: true,
  });

  return true;
}


