// ---- Card Types ----
export type ComponentType = 'fire' | 'ice' | 'wax' | 'stardust'
export type SpellType = 'actionSpell' | 'tome' | 'firebolt' | 'shield'

export interface ComponentCard {
  id: string
  kind: 'component'
  component: ComponentType
}

export interface SpellCard {
  id: string
  kind: 'spell'
  spell: SpellType
  actionCost: number
  components: ComponentType[] // what components are needed to cast it
}

export type Card = ComponentCard | SpellCard

// ---- Deck Builder ----
let cardCounter = 0
function makeId(): string {
  cardCounter++
  return `card_${cardCounter}`
}

export function buildStarterDeck(): Card[] {
  return [
    // Components — 3 of each
    { id: makeId(), kind: 'component', component: 'fire' },
    { id: makeId(), kind: 'component', component: 'fire' },
    { id: makeId(), kind: 'component', component: 'fire' },
    { id: makeId(), kind: 'component', component: 'ice' },
    { id: makeId(), kind: 'component', component: 'ice' },
    { id: makeId(), kind: 'component', component: 'ice' },
    { id: makeId(), kind: 'component', component: 'wax' },
    { id: makeId(), kind: 'component', component: 'wax' },
    { id: makeId(), kind: 'component', component: 'wax' },
    { id: makeId(), kind: 'component', component: 'stardust' },
    { id: makeId(), kind: 'component', component: 'stardust' },
    { id: makeId(), kind: 'component', component: 'stardust' },
    // Two of each spell
    { id: makeId(), kind: 'spell', spell: 'actionSpell', actionCost: 1, components: ['fire', 'wax'] },
    { id: makeId(), kind: 'spell', spell: 'actionSpell', actionCost: 1, components: ['fire', 'wax'] },
    { id: makeId(), kind: 'spell', spell: 'tome',        actionCost: 1, components: ['ice', 'stardust'] },
    { id: makeId(), kind: 'spell', spell: 'tome',        actionCost: 1, components: ['ice', 'stardust'] },
    { id: makeId(), kind: 'spell', spell: 'firebolt',    actionCost: 1, components: ['fire', 'stardust'] },
    { id: makeId(), kind: 'spell', spell: 'firebolt',    actionCost: 1, components: ['fire', 'stardust'] },
    { id: makeId(), kind: 'spell', spell: 'shield',      actionCost: 1, components: ['ice', 'wax'] },
    { id: makeId(), kind: 'spell', spell: 'shield',      actionCost: 1, components: ['ice', 'wax'] },
  ]
}

export function shuffle(deck: Card[]): Card[] {
  const d = [...deck]
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = d[i]
    if (temp === undefined || d[j] === undefined) continue
    d[i] = d[j] as Card
    d[j] = temp
  }
  return d
}

// The things with and of a player
export interface Player {
  id: string
  name: string
  hp: number
  shield: number
  actionPoints: number
  deck: Card[]
  hand: Card[]
  discard: Card[]
}

// The full game state
export interface GameState {
  players: Record<string, Player>
  currentTurn: string | null
  phase: 'waiting' | 'playing' | 'ended'
  lastPlayed: { playerId: string; card: SpellCard } | null
  turn: number
  history: Record<string, HistoryEntry[]> // keyed by playerId
}

// The single source of truth
export const gameState: GameState = {
  players: {},
  currentTurn: null,
  phase: 'waiting',
  lastPlayed: null,
  turn: 0,
  history: {}
}

// Add a player to the game
export function addPlayer(id: string, name: string): void {
  const deck = shuffle(buildStarterDeck())
  const hand = deck.splice(0, 5)

  gameState.players[id] = {
    id,
    name,
    hp: 10,
    shield: 0,
    actionPoints: 1,
    deck,
    hand,
    discard: []
  }
  gameState.history[id] = []
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

export function drawCards(playerId: string, amount: number): void {
  const player = gameState.players[playerId]
  if (player === undefined) return

  for (let i = 0; i < amount; i++) {
    // If deck is empty, shuffle discard back into deck
    if (player.deck.length === 0) {
      if (player.discard.length === 0) return // nothing left to draw
      player.deck = shuffle(player.discard)
      player.discard = []
    }

    const card = player.deck.shift()
    if (card === undefined) return
    player.hand.push(card)
  }
}

export function playSpell(playerId: string, spellCardId: string, componentCardIds: string[]): boolean {
  const player = gameState.players[playerId]
  if (player === undefined) return false

  // Find the spell card in hand
  const spellCard = player.hand.find(c => c.id === spellCardId)
  if (spellCard === undefined || spellCard.kind !== 'spell') return false

  // Check player has enough action points
  if (player.actionPoints < spellCard.actionCost) return false

  // Find the component cards in hand
  const componentCards = componentCardIds.map(id => player.hand.find(c => c.id === id))
  if (componentCards.some(c => c === undefined)) return false

  // Check the components match what the spell needs
  const providedTypes = componentCards.map(c => (c as ComponentCard).component).sort()
  const requiredTypes = [...spellCard.components].sort()
  const match = providedTypes.every((t, i) => t === requiredTypes[i])
  if (!match) return false

  // All checks passed — spend action points
  player.actionPoints -= spellCard.actionCost

  // Remove spell + components from hand, move to discard
  const usedIds = new Set([spellCardId, ...componentCardIds])
  player.discard.push(...player.hand.filter(c => usedIds.has(c.id)))
  player.hand = player.hand.filter(c => !usedIds.has(c.id))

  // Resolve the spell effect
  resolveSpell(spellCard.spell, playerId)
    // Track what was just played
    gameState.lastPlayed = { playerId, card: spellCard }
    // Record in history
    gameState.history[playerId]?.push({
    spellName: spellCard.spell,
    turn: gameState.turn
    })

  return true
}

function resolveSpell(spell: SpellType, casterId: string): void {
  const player = gameState.players[casterId]
  if (player === undefined) return

  const opponentId = Object.keys(gameState.players).find(id => id !== casterId)
  const opponent = opponentId ? gameState.players[opponentId] : undefined

  switch (spell) {
    case 'actionSpell':
      player.actionPoints += 1
      break

    case 'tome':
      drawCards(casterId, 4)
      break

    case 'firebolt':
      if (opponent === undefined) break
      const damage = 3
      const absorbed = Math.min(opponent.shield, damage)
      opponent.shield -= absorbed
      opponent.hp -= (damage - absorbed)
      // clamp hp to 0
      if (opponent.hp < 0) opponent.hp = 0
      break

    case 'shield':
      player.shield += 1
      break
  }
}

export function endTurn(playerId: string): void {
  const player = gameState.players[playerId]
  if (player === undefined) return

  player.actionPoints = 1
  player.shield = 0
  gameState.turn += 1

  // Draw back up to 7 cards
  const cardsToDraw = 7 - player.hand.length
  const cardsToDraw = 5 - player.hand.length
  if (cardsToDraw > 0) drawCards(playerId, cardsToDraw)

  nextTurn()
}

export function drawTwo(playerId: string): boolean {
  const player = gameState.players[playerId]
  if (player === undefined) return false

  drawCards(playerId, 2)
  return true
}

export function checkWin(): string | null {
  for (const player of Object.values(gameState.players)) {
    if (player.hp <= 0) {
      gameState.phase = 'ended'
      return player.id // this player lost
    }
  }
  return null
}

export interface HistoryEntry {
  spellName: SpellType
  turn: number
}