import http from 'http';
import { Client, Collection, GatewayIntentBits, Events } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const port = process.env.PORT || 3000;

// Renderが検知できるように簡単なHTTPサーバーを起動
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot is running');
});
server.listen(port, () => {
  console.log(`HTTP server listening on port ${port}`);
});

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// コマンドをCollectionに読み込み
client.commands = new Collection();

const commandsPath = path.resolve('./commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = await import(filePath);
  client.commands.set(command.data.name, command);
}

// イベントの読み込み
const eventsPath = path.resolve('./events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = await import(filePath);
  if (event.default.once) {
    client.once(event.default.name, (...args) => event.default.execute(...args));
  } else {
    client.on(event.default.name, (...args) => event.default.execute(...args));
  }
}

client.login(process.env.DISCORD_TOKEN);
