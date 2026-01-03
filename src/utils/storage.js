const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'tickets.db');
const db = new sqlite3.Database(dbPath);

function init() {
  return new Promise((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS panel_messages (
        guild_id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        message_id TEXT NOT NULL,
        hash TEXT NOT NULL
      );`,
      (error) => {
        if (error) {
          reject(error);
          return;
        }

        db.run(
          `CREATE TABLE IF NOT EXISTS ticket_blacklist (
            user_id TEXT PRIMARY KEY,
            added_by TEXT NOT NULL,
            created_at TEXT NOT NULL
          );`,
          (blacklistError) => {
            if (blacklistError) reject(blacklistError);
            else resolve();
          }
        );
      }
    );
  });
}

function getAllPanels() {
  return new Promise((resolve, reject) => {
    db.all('SELECT guild_id, channel_id, message_id, hash FROM panel_messages', (error, rows) => {
      if (error) reject(error);
      else resolve(rows);
    });
  });
}

function upsertPanel(guildId, channelId, messageId, hash) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO panel_messages (guild_id, channel_id, message_id, hash)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(guild_id) DO UPDATE SET
         channel_id = excluded.channel_id,
         message_id = excluded.message_id,
         hash = excluded.hash;`,
      [guildId, channelId, messageId, hash],
      (error) => {
        if (error) reject(error);
        else resolve();
      }
    );
  });
}

function addBlacklist(userId, addedBy) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR IGNORE INTO ticket_blacklist (user_id, added_by, created_at)
       VALUES (?, ?, ?);`,
      [userId, addedBy, new Date().toISOString()],
      (error) => {
        if (error) reject(error);
        else resolve();
      }
    );
  });
}

function removeBlacklist(userId) {
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM ticket_blacklist WHERE user_id = ?',
      [userId],
      (error) => {
        if (error) reject(error);
        else resolve();
      }
    );
  });
}

function isBlacklisted(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT user_id FROM ticket_blacklist WHERE user_id = ?',
      [userId],
      (error, row) => {
        if (error) reject(error);
        else resolve(Boolean(row));
      }
    );
  });
}

module.exports = {
  init,
  getAllPanels,
  upsertPanel,
  addBlacklist,
  isBlacklisted,
  removeBlacklist
};
