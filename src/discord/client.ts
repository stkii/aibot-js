import { Client, type ClientOptions, Collection, GatewayIntentBits } from 'discord.js';

import type { SlashCommand } from './types';

/**
 * Extended Discord client with slash command storage.
 * Manages bot commands and Discord gateway connections.
 */
class BotClient extends Client {
  /* Collection of registered slash commands. */
  commands: Collection<string, SlashCommand>;

  /**
   * Creates a new bot client instance.
   * @param options - Discord client configuration options
   */
  constructor(options: ClientOptions) {
    super(options);
    // Store slash commands
    this.commands = new Collection();
  }
}

// Cached singleton instance of the bot client.
let client: BotClient | undefined;

// Promise for pending client initialization.
let clientPromise: Promise<BotClient> | undefined;

/**
 * Gets or creates the singleton bot client instance.
 * Ensures only one client is initialized, even with concurrent calls.
 * @returns Promise resolving to the bot client instance
 */
export function getClient(): Promise<BotClient> {
  // Return cached instance if already initialized
  if (client) return Promise.resolve(client);

  // Return pending promise if initialization is in progress
  // This prevents multiple initialization attempts
  if (clientPromise) return clientPromise;

  // Initialize client on first call
  clientPromise = (async () => {
    const c = new BotClient({ intents: [GatewayIntentBits.Guilds] });
    client = c;
    return c;
  })();

  return clientPromise;
}

/**
 * Destroys the bot client and clears cached instances.
 * Should be called during application shutdown.
 */
export async function disposeClient(): Promise<void> {
  if (client) {
    await client.destroy();
    client = undefined;
    clientPromise = undefined;
  }
}
