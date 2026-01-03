const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { handleClaim, isStaff } = require('../utils/tickets');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('claim')
    .setDescription('Claim this ticket'),
  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      await interaction.reply({
        content: 'no yuh',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    await handleClaim(interaction);
  }
};
