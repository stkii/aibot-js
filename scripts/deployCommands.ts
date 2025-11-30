import { REST, Routes } from 'discord.js';

import { discoverCommands } from '../src/discord/commands/index';
import { getConfig } from '../src/infrastructure/config';

async function main() {
  const clientId = process.env['BOT_CLIENT_ID'];
  const guildId = process.env['DISCORD_GUILD_ID'];
  const { discordBotToken } = await getConfig();

  if (!clientId) throw new Error('Environment variable "BOT_CLIENT_ID" is not available');
  if (!guildId) throw new Error('Environment variable "DISCORD_GUILD_ID" is not available');
  if (!discordBotToken) throw new Error('Discord bot token is not configured.');

  const commands = await discoverCommands();
  const rest = new REST().setToken(discordBotToken);

  console.log(`Deploying ${commands.length} commands...`);

  await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
    body: commands.map((c) => c.data.toJSON()),
  });
  console.log('Deployment complete.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
