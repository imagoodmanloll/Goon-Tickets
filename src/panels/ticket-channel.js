const {
  MessageFlags,
  TextDisplayBuilder,
  SectionBuilder,
  ContainerBuilder,
  ThumbnailBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const path = require('path');

const THUMBNAIL_NAME = 'seriousrug.webp';

function buildTicketChannelPanel(user) {
  const thumbnailPath = path.join(__dirname, '../../assets/seriousrug.webp');
  const thumbnailAttachment = new AttachmentBuilder(thumbnailPath).setName(THUMBNAIL_NAME);
  const thumbnail = new ThumbnailBuilder({
    media: { url: `attachment://${THUMBNAIL_NAME}` }
  });

  const header = new SectionBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## :star: Gooners Production - Goon Tickets :star:\n### ${user} Welcome to your tickets, please wait for our staff to arrive, please be patience.`
      )
    )
    .setThumbnailAccessory(thumbnail);

  const actions = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('Close Ticket')
      .setEmoji('⛔')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('ticket_claim')
      .setLabel('Claim Ticket')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Success)
  );

  const container = new ContainerBuilder()
    .setAccentColor(16756067)
    .addSectionComponents(header)
    .addActionRowComponents(actions);

  return {
    payload: {
      flags: MessageFlags.IsComponentsV2,
      components: [container],
      files: [thumbnailAttachment]
    }
  };
}

module.exports = {
  buildTicketChannelPanel
};
