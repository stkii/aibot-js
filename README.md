# AIBot

<a href="https://www.typescriptlang.org" target="_blank"><img src="https://img.shields.io/badge/TypeScript-3178C6.svg?logo=typescript&logoColor=white&style=flat" alt="TypeScript-Badge"></a>

> [!WARNING]
> This project is intended for local use and should not be exposed publicly.

## Quick Start

### 1. Clone repo and install

```bash
git clone https://github.com/stkii/aibot-js.git

cd aibot-js/
```

### 2. Prepare your env file

Copy `.env.sample` to `.env` and fill in the required values.

### 3. Google Cloud configuration (optional)

If you use Google Cloud:

- Set up a Compute Engine VM instance
- Add Discord bot token and OpenAI API key to Secret Manager

### 4. Run the bot

```bash
# Generate and apply database migrations
pnpm db:gen

pnpm db:migrate

# Registar slash commands
pnpm deploy:commands

# Run the bot
pnpm start

# ==============================

# Restart the bot
pnpm restart

# Stop the bot
pnpm stop
```
