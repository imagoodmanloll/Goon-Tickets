const { PermissionsBitField, MessageFlags } = require('discord.js');
const { buildTranscriptAttachment } = require('./transcripts');
const config = require('../../config/config.json');

function isTicketChannel(channel) {
  return Boolean(channel?.topic && channel.topic.startsWith('ticket:'));
}

function isStaff(member) {
  if (!member) return false;
  if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return true;
  const supportRoleId = config.supportRoleId;
  if (!supportRoleId || supportRoleId === 'OPTIONAL_SUPPORT_ROLE_ID') return false;
  return member.roles.cache.has(supportRoleId);
}

async function addUserToTicket(channel, userId) {
  await channel.permissionOverwrites.edit(userId, {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true
  });
}

async function removeUserFromTicket(channel, userId) {
  await channel.permissionOverwrites.delete(userId);
}

async function handleClaim(interaction) {
  if (!isTicketChannel(interaction.channel)) {
    await interaction.reply({
      content: 'This command only works in ticket channels.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  if (!isStaff(interaction.member)) {
    await interaction.reply({
      content: 'no yuh',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  await interaction.reply({
    content: `Ticket claimed by ${interaction.user}.`
  });
}

async function handleClose(interaction) {
  if (!isTicketChannel(interaction.channel)) {
    await interaction.reply({
      content: 'This command only works in ticket channels.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  await interaction.reply({
    content: 'The ticket will be closed in 10s'
  });

  setTimeout(async () => {
    try {
      const logChannelId = config.loggingChannelId;
      if (logChannelId && logChannelId !== 'OPTIONAL_LOG_CHANNEL_ID') {
        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        if (logChannel && logChannel.isTextBased()) {
          const transcript = await buildTranscriptAttachment(interaction.channel);
          await logChannel.send({
            content: `Transcript for ${interaction.channel} (${interaction.channel.id})`,
            files: [transcript]
          });
        }
      }
    } catch (error) {
      console.error('Failed to log transcript:', error);
    }

    try {
      await interaction.channel.delete('Ticket closed');
    } catch (error) {
      console.error('Failed to delete channel:', error);
    }
  }, 10000);
}

module.exports = {
  isTicketChannel,
  isStaff,
  addUserToTicket,
  removeUserFromTicket,
  handleClaim,
  handleClose
};
