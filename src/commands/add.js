const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { isStaff, isTicketChannel, addUserToTicket } = require('../utils/tickets');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('Add a user to this ticket')
    .addUserOption((option) =>
      option.setName('user').setDescription('User to add').setRequired(true)
    ),
  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      await interaction.reply({
        content: 'no yuh',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    if (!isTicketChannel(interaction.channel)) {
      await interaction.reply({
        content: 'This command only works in ticket channels.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const user = interaction.options.getUser('user', true);
    await addUserToTicket(interaction.channel, user.id);
    await interaction.reply({
      content: `Added ${user} to this ticket.`,
      flags: MessageFlags.Ephemeral
    });
  }
};
