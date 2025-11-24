import { Events } from 'discord.js';

import { getClient } from './discord/client';
import { discoverCommands } from './discord/commands/index';
import { registerInteractionHandlers } from './discord/events';
import { getConfig } from './infrastructure/config';
import { scheduleDailyTokenAggregation } from './service/tokenAggregation';

async function main() {
  // Get secret key
  const config = await getConfig();

  // Create Bot Client
  const client = await getClient();

  // Handle slash commands
  const discovered = await discoverCommands();
  for (const cmd of discovered) {
    client.commands.set(cmd.data.name, cmd);
  }

  // Register only command interaction handlers (Ready stays here)
  registerInteractionHandlers(client);

  // Bootstrap daily token aggregation
  scheduleDailyTokenAggregation();

  // When the client is ready, run this code only once
  client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  });

  // Log in to Discord with your client's token from config
  await client.login(config.discordBotToken);

  console.log('Successfully logged in !');
}

main();
