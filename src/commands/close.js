const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { handleClose, isStaff } = require('../utils/tickets');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('close')
    .setDescription('Close this ticket'),
  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      await interaction.reply({
        content: 'no yuh',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    await handleClose(interaction);
  }
};
