// The shape of a player
export interface Player {
  id: string
  name: string
  score: number
}

// The full game state
export interface GameState {
  players: Record<string, Player>
  currentTurn: string | null
  phase: 'waiting' | 'playing' | 'ended'
}

// The single source of truth
export const gameState: GameState = {
  players: {},
  currentTurn: null,
  phase: 'waiting'
}

// Add a player to the game
export function addPlayer(id: string, name: string): void {
  gameState.players[id] = { id, name, score: 0 }
}

// Remove a player from the game
export function removePlayer(id: string): void {
  delete gameState.players[id]
}

// Start the game
export function startGame(): void {
  const playerIds = Object.keys(gameState.players)
  if (playerIds.length < 2) return // need at least 2 players
  gameState.phase = 'playing'
  gameState.currentTurn = playerIds[0] ?? null  // ?? null handles the undefined
}

// Advance to the next player's turn
export function nextTurn(): void {
  const playerIds = Object.keys(gameState.players)
  const currentIndex = playerIds.indexOf(gameState.currentTurn!)
  const nextIndex = (currentIndex + 1) % playerIds.length
  gameState.currentTurn = playerIds[nextIndex] ?? null  // ?? null handles the undefined
}