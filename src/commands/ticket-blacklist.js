const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { isStaff } = require('../utils/tickets');
const storage = require('../utils/storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-blacklist')
    .setDescription('Blacklist a user from creating tickets')
    .addUserOption((option) =>
      option.setName('user').setDescription('User to blacklist').setRequired(true)
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
    await storage.addBlacklist(user.id, interaction.user.id);
    await interaction.reply({
      content: `Blacklisted ${user} from creating tickets.`,
      flags: MessageFlags.Ephemeral
    });
  }
};
