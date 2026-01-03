const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { buildTicketPanel } = require('../panels/ticket-panel');
const storage = require('../storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('send'),
  async execute(interaction) {
    await interaction.reply({
      content: 'sent.',
      flags: MessageFlags.Ephemeral
    });

    const { payload, hash } = buildTicketPanel();
    const message = await interaction.channel.send(payload);
    await storage.upsertPanel(
      interaction.guild.id,
      interaction.channel.id,
      message.id,
      hash
    );
  }
};
