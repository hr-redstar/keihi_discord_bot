import http from 'http';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const port = process.env.PORT || 3000;

// Render向けにHTTPサーバ起動
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot is running');
});
server.listen(port, () => {
  console.log(`HTTP server listening on port ${port}`);
});

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
client.commands = new Collection();

(async () => {
  try {
    // コマンド読み込み
    const commandsPath = path.resolve('./commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const commandModule = await import(filePath);
      const command = commandModule.default ?? commandModule;
      if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
      } else {
        console.warn(`Invalid command module: ${file}`);
      }
    }

    // イベント読み込み
    const eventsPath = path.resolve('./events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
      const filePath = path.join(eventsPath, file);
      const eventModule = await import(filePath);
      const event = eventModule.default ?? eventModule;
      if (!event || !event.name || !event.execute) {
        console.warn(`Invalid event module: ${file}`);
        continue;
      }
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
      } else {
        client.on(event.name, (...args) => event.execute(...args));
      }
    }

    await client.login(process.env.DISCORD_TOKEN);
  } catch (err) {
    console.error('Error loading commands or events:', err);
  }
})();
