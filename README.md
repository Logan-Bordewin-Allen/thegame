# The Game — Server Setup

## Prerequisites

Install this before anything else:

- **Node.js** (LTS) → https://nodejs.org

Verify installs by opening a terminal in the thegame/server folder:

```bash
node -v
npm -v
git --version
```

All three should print a version number.

---

**make sure cd'ed into thegame/server for all of this**

Install dependencies:

```bash
npm install
```
you might have to do this but dont do it untill something errors

```bash
npm install -D ts-node
```

Run the development server:

```bash
npm run dev
```

You should see:

```
Server running on http://localhost:3000
```

---

## Project Structure

```
server/
├── index.ts        ← socket events, entry point
├── gameState.ts    ← all game logic and state
├── tsconfig.json   ← TypeScript config
└── package.json
```

---

## Key Concepts

### The golden rule
The server is the single source of truth. The client never modifies game state directly — it only sends actions. The server validates, updates state, and broadcasts to everyone.

### Socket events the server listens for

| Event | Payload | Description |
|---|---|---|
| `playSpell` | `spellCardId, componentCardIds[]` | Player casts a spell |
| `endTurn` | none | Player ends their turn |
| `drawTwo` | none | Player draws 2 cards for free |

### Socket events the server emits

| Event | Payload | Description |
|---|---|---|
| `stateUpdate` | `gameState` | Sent to all players after any action |
| `invalidMove` | `message` | Sent to one player if their action was invalid |
| `gameOver` | `{ loserId }` | Sent to all players when someone reaches 0hp |


## Finding Your Local IP (for testing across machines)

Open Git Bash and run:

```bash
ipconfig
```

Look for **IPv4 Address** — something like `192.168.1.42`. Share this with the frontend dev so they can connect to your server over the same WiFi.

---
