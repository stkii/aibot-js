import { REST, Routes } from 'discord.js';

import { discoverCommands } from '../src/discord/commands/index';

async function main() {
  const clientId = process.env['BOT_CLIENT_ID'];
  const guildId = process.env['DISCORD_GUILD_ID'];
  const token = process.env['DISCORD_BOT_TOKEN'];

  if (!clientId) throw new Error('Environment variable "BOT_CLIENT_ID" is not available');
  if (!guildId) throw new Error('Environment variable "DISCORD_GUILD_ID" is not available');
  if (!token) throw new Error('Environment variable "DISCORD_BOT_TOKEN" is not available');

  const commands = await discoverCommands();
  const rest = new REST().setToken(token);

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
