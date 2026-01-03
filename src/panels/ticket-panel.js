const {
  MessageFlags,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SectionBuilder,
  ContainerBuilder,
  ThumbnailBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const path = require('path');
const crypto = require('crypto');

const THUMBNAIL_NAME = 'seriousrug.webp';

function buildTicketPanel() {
  const thumbnailPath = path.join(__dirname, '../../assets/seriousrug.webp');
  const thumbnailAttachment = new AttachmentBuilder(thumbnailPath).setName(THUMBNAIL_NAME);
  const thumbnail = new ThumbnailBuilder({
    media: { url: `attachment://${THUMBNAIL_NAME}` }
  });

  const container = new ContainerBuilder()
    .setAccentColor(16756067)
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            '## :star: Gooners Production - Goon Tickets :star:\n### Are you seeking for help from our support team? click the button below to open a support ticket, our team will assist you as soon as possible.'
          )
        )
        .setThumbnailAccessory(thumbnail)
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Small)
    )
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            '### 🎫 : Support Tickets\n- Get support from our staff team with your question.'
          )
        )
        .setButtonAccessory(
          new ButtonBuilder()
            .setCustomId('ticket_support')
            .setEmoji('🎫')
            .setLabel('Support')
            .setStyle(ButtonStyle.Primary)
        )
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            '### 🚨 : Report Tickets\n- Report anyone if you have proof of what they violate.'
          )
        )
        .setButtonAccessory(
          new ButtonBuilder()
            .setCustomId('ticket_report')
            .setEmoji('🚨')
            .setLabel('Report')
            .setStyle(ButtonStyle.Danger)
        )
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            '### 💸 : Purchase Tickets\n- Purchase Gooners Production products.'
          )
        )
        .setButtonAccessory(
          new ButtonBuilder()
            .setCustomId('ticket_purchase')
            .setEmoji('💸')
            .setLabel('Purchase')
            .setStyle(ButtonStyle.Success)
        )
    );

  const components = [container];
  const files = [thumbnailAttachment];

  const hashSource = JSON.stringify({
    components: components.map((component) => component.toJSON()),
    files: [THUMBNAIL_NAME]
  });
  const hash = crypto.createHash('sha256').update(hashSource).digest('hex');

  return {
    payload: {
      flags: MessageFlags.IsComponentsV2,
      components,
      files
    },
    hash
  };
}

module.exports = {
  buildTicketPanel
};
