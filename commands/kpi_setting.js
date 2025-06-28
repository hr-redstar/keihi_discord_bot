import { SlashCommandBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';

const STORE_FILE = path.resolve('./data/kpi_store.json');

function readStore() {
  try {
    const data = fs.readFileSync(STORE_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return { shops: [], targets: {} };
  }
}

function saveStore(store) {
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
}

export const data = new SlashCommandBuilder()
  .setName('kpi_設定')
  .setDescription('KPI用の店舗設定や目標を登録します');

export async function execute(interaction) {
  const store = readStore();

  // モーダル構築（店舗名追加、日付、目標数）
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

  const actionRows = [
    new ActionRowBuilder().addComponents(newShopInput),
    new ActionRowBuilder().addComponents(dateInput),
    new ActionRowBuilder().addComponents(targetInput),
  ];

  modal.addComponents(...actionRows);
  await interaction.showModal(modal);
}

// モーダルハンドリングは別のイベントファイルで処理（例: events/interactionCreate.js）
