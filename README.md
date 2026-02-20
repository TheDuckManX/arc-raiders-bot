# Arc Raiders Bot

A Twitch chatbot API backend for [Arc Raiders](https://www.arcraiders.com/), powered by [metaforge.app](https://metaforge.app/arc-raiders).

Viewers type commands in Twitch chat (via [Fossabot](https://fossabot.com/)) and get instant info on quests, items, ARC enemies, map locations, and more.

## Features

| Command | Description |
|---|---|
| `!arc <name>` | ARC enemy info and loot drops (e.g. `!arc wasp`) |
| `!quest <name>` | Quest details, objectives, and rewards |
| `!quests` | List all available quests |
| `!item <name>` | Item/weapon lookup |
| `!map <name>` | Interactive map link (e.g. `!map dam`, `!map stella-top`) |
| `!maps` | List all available maps |
| `!events` | Upcoming in-game events |
| `!arcblueprint <name>` | Blueprint location lookup |

## Setup

### 1. Clone and install

```bash
git clone https://github.com/TheDuckManX/arc-raiders-bot.git
cd arc-raiders-bot
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set your `API_KEY`:

```bash
openssl rand -hex 32   # generates a secure key
```

### 3. Run locally

```bash
npm run dev       # development (hot reload via nodemon)
npm start         # production
```

Or use the helper scripts:

```bash
./start.sh        # starts server + ngrok tunnel
./stop.sh         # stops both
./status.sh       # checks health
```

### 4. Deploy to Railway

1. Push this repo to GitHub
2. Create a new Railway project from the repo
3. Set `API_KEY` in Railway → Variables
4. Railway will auto-deploy on push

### 5. Add Fossabot commands

See [QUICK-START.md](QUICK-START.md) for copy-paste Fossabot command templates.

## Security

See [SECURITY.md](SECURITY.md) for details on authentication, rate limiting, and key management.

## Data

Game data is sourced from [metaforge.app/arc-raiders](https://metaforge.app/arc-raiders). ARC enemy loot tables are stored locally in `data/arc_loot.json`.

## License

MIT
