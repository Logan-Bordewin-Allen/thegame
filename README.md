# The Game — Server Setup

## Prerequisites

Install before anything else:

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


Look for **IPv4 Address** — something like `192.168.1.42`.
```
