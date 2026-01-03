const path = require('path');
const { AttachmentBuilder } = require('discord.js');

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatTimestamp(date) {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function renderEmbed(embed) {
  const parts = [];
  if (embed.title) {
    parts.push(`<div class="embed-title">${escapeHtml(embed.title)}</div>`);
  }
  if (embed.description) {
    parts.push(
      `<div class="embed-description">${escapeHtml(embed.description)}</div>`
    );
  }
  if (embed.fields?.length) {
    const fields = embed.fields
      .map(
        (field) =>
          `<div class="embed-field"><div class="embed-field-name">${escapeHtml(
            field.name
          )}</div><div class="embed-field-value">${escapeHtml(
            field.value
          )}</div></div>`
      )
      .join('');
    parts.push(`<div class="embed-fields">${fields}</div>`);
  }
  if (embed.image?.url) {
    parts.push(
      `<div class="embed-media"><img src="${embed.image.url}" alt="Embed image" /></div>`
    );
  }
  if (embed.thumbnail?.url) {
    parts.push(
      `<div class="embed-thumb"><img src="${embed.thumbnail.url}" alt="Embed thumbnail" /></div>`
    );
  }
  return parts.join('');
}

function renderAttachments(message) {
  const items = [];
  for (const attachment of message.attachments.values()) {
    const url = attachment.url;
    if (attachment.contentType?.startsWith('image/')) {
      items.push(
        `<div class="message-attachment"><img src="${url}" alt="${escapeHtml(
          attachment.name || 'image'
        )}" /></div>`
      );
    } else {
      items.push(
        `<div class="message-attachment"><a href="${url}">${escapeHtml(
          attachment.name || url
        )}</a></div>`
      );
    }
  }
  return items.join('');
}

function buildTranscriptHtml({ guild, channel, messages }) {
  const rows = messages
    .map((message) => {
      const author = message.author;
      const avatar = author?.displayAvatarURL({ extension: 'png', size: 64 }) || '';
      const username = author ? `${author.username}#${author.discriminator}` : 'Unknown';
      const timestamp = formatTimestamp(message.createdAt);
      const content = message.content ? escapeHtml(message.content).replace(/\n/g, '<br />') : '';
      const embeds = message.embeds?.length
        ? `<div class="embeds">${message.embeds
            .map((embed) => `<div class="embed">${renderEmbed(embed)}</div>`)
            .join('')}</div>`
        : '';
      const attachments = renderAttachments(message);

      return `
        <div class="message">
          <img class="avatar" src="${avatar}" alt="${escapeHtml(username)}" />
          <div class="message-body">
            <div class="meta">
              <span class="username">${escapeHtml(username)}</span>
              <span class="timestamp">${escapeHtml(timestamp)}</span>
            </div>
            ${content ? `<div class="content">${content}</div>` : ''}
            ${embeds}
            ${attachments}
          </div>
        </div>
      `;
    })
    .join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(channel.name)} transcript</title>
    <style>
      :root {
        color-scheme: dark;
      }
      body {
        margin: 0;
        background: #313338;
        color: #f2f3f5;
        font: 15px/1.4 "gg sans", "Segoe UI", Arial, sans-serif;
      }
      .header {
        padding: 20px 24px;
        border-bottom: 1px solid #1e1f22;
        background: #2b2d31;
      }
      .header h1 {
        margin: 0 0 4px 0;
        font-size: 18px;
      }
      .header span {
        color: #aeb3b9;
        font-size: 13px;
      }
      .messages {
        padding: 16px 24px 32px;
      }
      .message {
        display: flex;
        gap: 12px;
        padding: 10px 0;
      }
      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
      }
      .message-body {
        flex: 1;
      }
      .meta {
        display: flex;
        align-items: baseline;
        gap: 8px;
      }
      .username {
        font-weight: 600;
      }
      .timestamp {
        color: #aeb3b9;
        font-size: 12px;
      }
      .content {
        margin: 4px 0 8px;
        white-space: normal;
      }
      .embeds {
        display: grid;
        gap: 8px;
        margin-bottom: 8px;
      }
      .embed {
        background: #2b2d31;
        border-left: 4px solid #4e5058;
        padding: 8px 12px;
        border-radius: 4px;
      }
      .embed-title {
        font-weight: 600;
        margin-bottom: 4px;
      }
      .embed-description {
        color: #dbdee1;
      }
      .embed-fields {
        display: grid;
        gap: 6px;
        margin-top: 8px;
      }
      .embed-field-name {
        font-weight: 600;
      }
      .embed-media img,
      .message-attachment img {
        max-width: 420px;
        border-radius: 6px;
        margin-top: 6px;
      }
      .message-attachment a {
        color: #00a8fc;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>${escapeHtml(guild.name)} · #${escapeHtml(channel.name)}</h1>
      <span>Exported ${escapeHtml(new Date().toLocaleString('en-US'))}</span>
    </div>
    <div class="messages">
      ${rows}
    </div>
  </body>
</html>`;
}

async function fetchAllMessages(channel) {
  let lastId = undefined;
  const all = [];
  while (true) {
    const batch = await channel.messages.fetch({ limit: 100, before: lastId });
    if (!batch.size) break;
    all.push(...batch.values());
    lastId = batch.last()?.id;
    if (!lastId) break;
  }
  return all.reverse();
}

async function buildTranscriptAttachment(channel) {
  const messages = await fetchAllMessages(channel);
  const html = buildTranscriptHtml({
    guild: channel.guild,
    channel,
    messages
  });
  const filename = `${channel.name}-transcript.html`;
  const buffer = Buffer.from(html, 'utf-8');
  return new AttachmentBuilder(buffer, { name: filename });
}

module.exports = {
  buildTranscriptAttachment
};
