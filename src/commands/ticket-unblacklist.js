const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { isStaff } = require('../utils/tickets');
const storage = require('../utils/storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-unblacklist')
    .setDescription('Remove a user from the ticket blacklist')
    .addUserOption((option) =>
      option.setName('user').setDescription('User to unblacklist').setRequired(true)
    ),
  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      await interaction.reply({
        content: 'no yuh',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const user = interaction.options.getUser('user', true);
    await storage.removeBlacklist(user.id);
    await interaction.reply({
      content: `Removed ${user} from the ticket blacklist.`,
      flags: MessageFlags.Ephemeral
    });
  }
};
