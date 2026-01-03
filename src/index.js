const {
  Client,
  Collection,
  GatewayIntentBits,
  REST,
  Routes,
  ChannelType,
  PermissionsBitField,
  MessageFlags
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config/config.json');
const storage = require('./utils/storage');
const { buildTicketPanel } = require('./panels/ticket-panel');
const { buildTicketChannelPanel } = require('./panels/ticket-channel');
const {
  handleClaim,
  handleClose
} = require('./utils/tickets');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith('.js'));

const commandPayload = [];
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    commandPayload.push(command.data.toJSON());
  }
}

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(config.token);
  await rest.put(
    Routes.applicationGuildCommands(config.clientId, config.guildId),
    { body: commandPayload }
  );
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  try {
    await storage.init();
  } catch (error) {
    console.error('Failed to initialize storage:', error);
  }
  try {
    console.log('Registering slash commands...');
    await registerCommands();
    console.log('Slash commands registered.');
  } catch (error) {
    console.error('Failed to register slash commands:', error);
  }

  try {
    const panels = await storage.getAllPanels();
    if (panels.length > 0) {
      const { payload, hash } = buildTicketPanel();
      for (const panel of panels) {
        const guild = client.guilds.cache.get(panel.guild_id);
        if (!guild) continue;
        const channel = guild.channels.cache.get(panel.channel_id);
        if (!channel || !channel.isTextBased()) continue;

        let message = null;
        try {
          message = await channel.messages.fetch(panel.message_id);
        } catch {
          message = null;
        }

        if (!message) {
          const newMessage = await channel.send(payload);
          await storage.upsertPanel(
            guild.id,
            channel.id,
            newMessage.id,
            hash
          );
          continue;
        }

        if (panel.hash !== hash) {
          await message.edit(payload);
          await storage.upsertPanel(
            guild.id,
            channel.id,
            message.id,
            hash
          );
        }
      }
    }
  } catch (error) {
    console.error('Failed to restore ticket panels:', error);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(error);
    const reply = { content: 'error', flags: MessageFlags.Ephemeral };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  if (!interaction.customId.startsWith('ticket_')) return;

  const typeMap = {
    ticket_support: 'support',
    ticket_report: 'report',
    ticket_purchase: 'purchase'
  };
  const ticketType = typeMap[interaction.customId];

  if (interaction.customId === 'ticket_claim') {
    await handleClaim(interaction);
    return;
  }

  if (interaction.customId === 'ticket_close') {
    await handleClose(interaction);
    return;
  }

  if (!ticketType) return;

  try {
    const blocked = await storage.isBlacklisted(interaction.user.id);
    if (blocked) {
      await interaction.reply({
        content: 'You are blacklisted from creating tickets.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }
  } catch (error) {
    console.error('Failed to check blacklist:', error);
  }

  const existing = interaction.guild.channels.cache.find(
    (channel) => channel.topic === `ticket:${ticketType}:${interaction.user.id}`
  );
  if (existing) {
    await interaction.reply({
      content: `You already have an open ticket: ${existing}`,
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const safeName = interaction.user.username
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 20);

  const permissionOverwrites = [
    {
      id: interaction.guild.roles.everyone.id,
      deny: [PermissionsBitField.Flags.ViewChannel]
    },
    {
      id: interaction.user.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory
      ]
    }
  ];

  if (config.supportRoleId && config.supportRoleId !== 'OPTIONAL_SUPPORT_ROLE_ID') {
    permissionOverwrites.push({
      id: config.supportRoleId,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory
      ]
    });
  }

  const channel = await interaction.guild.channels.create({
    name: `${ticketType}-${safeName || interaction.user.id}`,
    type: ChannelType.GuildText,
    parent:
      config.ticketCategoryId && config.ticketCategoryId !== 'OPTIONAL_CATEGORY_ID'
        ? config.ticketCategoryId
        : null,
    topic: `ticket:${ticketType}:${interaction.user.id}`,
    permissionOverwrites
  });

  const { payload } = buildTicketChannelPanel(interaction.user);
  await channel.send(payload);

  await interaction.editReply({
    content: `Ticket created: ${channel}`
  });
});

client.login(config.token);
