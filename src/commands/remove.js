const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { isStaff, isTicketChannel, removeUserFromTicket } = require('../utils/tickets');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a user from this ticket')
    .addUserOption((option) =>
      option.setName('user').setDescription('User to remove').setRequired(true)
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
    await removeUserFromTicket(interaction.channel, user.id);
    await interaction.reply({
      content: `Removed ${user} from this ticket.`,
      flags: MessageFlags.Ephemeral
    });
  }
};
