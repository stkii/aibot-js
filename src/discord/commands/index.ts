import fs from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { SlashCommand } from '../types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Discovers all commands in this directory (commands/) and returns them as an array.
 *
 * This function recursively searches for TypeScript command modules in:
 * - Subdirectories of the commands folder
 * - The commands folder itself (excluding index.ts)
 *
 * Each module must export a default object with both:
 * - `data`: SlashCommandBuilder instance that defines the command
 * - `execute`: Async function that handles command execution
 *
 * @returns {Promise<SlashCommand[]>} Array of discovered and validated commands
 */
export async function discoverCommands(): Promise<SlashCommand[]> {
  const basePath = __dirname;
  const discovered: SlashCommand[] = [];

  const entries = fs.readdirSync(basePath);

  for (const entry of entries) {
    const entryPath = path.join(basePath, entry);
    const stat = fs.statSync(entryPath);

    // TypeScript files in subdirectories
    if (stat.isDirectory()) {
      const files = fs.readdirSync(entryPath).filter((f) => f.endsWith('.ts'));
      for (const file of files) {
        const filePath = path.join(entryPath, file);
        try {
          const command = (await import(filePath)).default as SlashCommand;
          if ('data' in command && 'execute' in command) {
            discovered.push(command);
          } else {
            console.log(`[WARNING] ${filePath} does not have "data" or "execute".`);
          }
        } catch (error) {
          console.error(`[ERROR] Failed to load command from ${filePath}:`, error);
        }
      }
    }

    // TypeScript files directly in commands directory (excluding index.ts)
    else if (stat.isFile() && entry.endsWith('.ts') && entry !== 'index.ts') {
      try {
        const command = (await import(entryPath)).default as SlashCommand;
        if ('data' in command && 'execute' in command) {
          discovered.push(command);
        } else {
          console.log(`[WARNING] ${entryPath} does not have "data" or "execute".`);
        }
      } catch (error) {
        console.error(`[ERROR] Failed to load command from ${entryPath}:`, error);
      }
    }
  }

  return discovered;
}
