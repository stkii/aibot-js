import { Events } from 'discord.js';

import { getClient } from './discord/client';
import { discoverCommands } from './discord/commands/index';
import { registerInteractionHandlers } from './discord/events';

async function main() {
  // Create Bot Client
  const client = await getClient();

  // Handle slash commands
  const discovered = await discoverCommands();
  for (const cmd of discovered) {
    client.commands.set(cmd.data.name, cmd);
  }

  // Register only command interaction handlers (Ready stays here)
  registerInteractionHandlers(client);

  // When the client is ready, run this code only once
  client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  });

  // Log in to Discord with your client's token
  const token = process.env['DISCORD_BOT_TOKEN'];
  if (!token) throw new Error('Environment variable "DISCORD_BOT_TOKEN" is not available');
  await client.login(token);

  console.log('Successfully logged in !');
}

main();
