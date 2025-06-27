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
        if (interaction.replied || inte
